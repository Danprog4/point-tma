import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { Map } from "~/components/Icons/Map";
import { YandexMap } from "~/components/YandexMap";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { EventsDrawer } from "~/EventsDrawer";
import { getAllEvents } from "~/lib/utils/getAllEvents";
import { useTRPC } from "~/trpc/init/react";
import { Clocks } from "../Icons/Clocks";
// Предустановленные тэги, которые будут предлагаться при вводе
const predefinedTags = ["Свидание", "Культурный вечер", "Театр", "Вслепую", "Ужин"];

export const Step2 = ({
  setLocations,
  setIndex,
  index,
  isDisabled,
  locations,
  length,
  setLength,

  setSelectedItems,
  setIsDisabled,
  selectedItems,
}: {
  index: number;
  setIndex: (index: number) => void;

  setLocations: (
    locations: {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      isCustom?: boolean;
    }[],
  ) => void;

  isDisabled: boolean;
  locations: {
    location: string;
    address: string;
    starttime?: string;
    endtime?: string;
    index?: number;
    isCustom?: boolean;
  }[];
  length: number;
  setLength: (length: number) => void;

  setSelectedItems: (items: { id: number; type: string; index: number }[]) => void;
  setIsDisabled: (isDisabled: boolean) => void;
  selectedItems: { id: number; type: string; index: number }[];
}) => {
  const [type, setType] = useState<"one" | "multiple">("one");

  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("Все");

  // Yandex search states
  const [showYandexResults, setShowYandexResults] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [geocodeLoading, setGeocodeLoading] = useState<{ [key: number]: boolean }>({});
  const [geocodeError, setGeocodeError] = useState<{ [key: number]: string | null }>({});

  const trpc = useTRPC();
  const searchAddress = useMutation(trpc.yandex.suggest.mutationOptions());
  const reverseGeocode = useMutation(trpc.yandex.reverseGeocode.mutationOptions());

  const extractMarkersFromSuggest = (): Array<[number, number]> => {
    try {
      if (!searchAddress.data || !Array.isArray(searchAddress.data.results)) return [];
      const coords: Array<[number, number]> = [];
      for (const r of searchAddress.data.results) {
        const pos =
          r?.geocode?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point
            ?.pos;
        if (typeof pos === "string") {
          const parts = pos.split(/\s+/).map((x: string) => parseFloat(x));
          if (parts.length === 2 && parts.every((n: number) => Number.isFinite(n))) {
            // Yandex returns "lon lat" string; keep [lon, lat]
            coords.push([parts[0], parts[1]]);
          }
        }
      }
      return coords;
    } catch (e) {
      console.warn("extractMarkersFromSuggest error", e);
      return [];
    }
  };

  // Handle Yandex search
  const handleYandexSearch = (locationIndex: number) => {
    const searchValue = locations[locationIndex]?.location;
    if (searchValue?.trim()) {
      setShowYandexResults((prev) => ({ ...prev, [locationIndex]: true }));
      searchAddress.mutate({
        query: searchValue,
        city: "Москва",
        types: "biz,geo",
        results: 10,
      });
    }
  };

  // Handle map click selection
  const handleMapLocationSelect = (
    locationIndex: number,
    coordinates: [number, number],
  ) => {
    const [lng, lat] = coordinates;
    setGeocodeLoading((prev) => ({ ...prev, [locationIndex]: true }));
    setGeocodeError((prev) => ({ ...prev, [locationIndex]: null }));

    reverseGeocode.mutate(
      { lat, lon: lng },
      {
        onSuccess: (data) => {
          const newLocations = [...locations];
          if (!newLocations[locationIndex]) {
            newLocations[locationIndex] = { location: "", address: "" };
          }
          const title = data?.name || "Выбранное место на карте";
          const address = data?.text || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          newLocations[locationIndex].location = title;
          newLocations[locationIndex].address = address;
          setLocations(newLocations);
          setShowYandexResults((prev) => ({ ...prev, [locationIndex]: false }));
          setGeocodeLoading((prev) => ({ ...prev, [locationIndex]: false }));
        },
        onError: (err) => {
          console.error("reverseGeocode error", err);
          const newLocations = [...locations];
          if (!newLocations[locationIndex]) {
            newLocations[locationIndex] = { location: "", address: "" };
          }
          if (!newLocations[locationIndex].location) {
            newLocations[locationIndex].location = "Точка на карте";
          }
          newLocations[locationIndex].address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setLocations(newLocations);
          setGeocodeError((prev) => ({
            ...prev,
            [locationIndex]: "Не удалось определить адрес, использованы координаты",
          }));
          setGeocodeLoading((prev) => ({ ...prev, [locationIndex]: false }));
        },
      },
    );
  };

  // Handle result selection
  const handleResultSelect = (result: any, locationIndex: number) => {
    const newLocations = [...locations];
    if (!newLocations[locationIndex]) {
      newLocations[locationIndex] = { location: "", address: "" };
    }

    // Fill название with result title
    const title =
      typeof result.title === "string"
        ? result.title
        : result.title?.text || "Название не найдено";
    newLocations[locationIndex].location = title;

    // Fill адрес with result address
    newLocations[locationIndex].address = result.address?.formatted_address || "";

    setLocations(newLocations);
    setShowYandexResults((prev) => ({ ...prev, [locationIndex]: false }));
  };

  // Helper functions for time validation
  const isValidTime = (time?: string): boolean => {
    if (!time) return false;
    const t = time.trim();
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);
  };

  const isStartBeforeEnd = (start?: string, end?: string): boolean => {
    if (!isValidTime(start) || !isValidTime(end)) return false;
    const [h1, m1] = start!.split(":").map(Number);
    const [h2, m2] = end!.split(":").map(Number);
    return h1 < h2 || (h1 === h2 && m1 < m2);
  };

  const { data, all } = getAllEvents(
    activeFilter,
    questsData,
    kinoData,
    conferencesData,
    networkingData,
    partiesData,
  );

  const getItems = useMemo(() => {
    return selectedItems
      .map((selectedItem) => {
        const matched = all.find(
          (item) => item.id === selectedItem.id && item.type === selectedItem.type,
        );
        if (!matched) return null;
        return { ...matched, index: selectedItem.index };
      })
      .filter((item): item is (typeof all)[0] & { index: number } => item !== null);
  }, [selectedItems, all]);

  useEffect(() => {
    if (locations.length === 0) {
      setIsDisabled(true);
      return;
    }

    // Проверяем все локации
    const valid = locations.every((loc, idx) => {
      // Если локация была выбрана из афиши (есть соответствующий selectedItem), она валидна
      const hasSelectedItem = selectedItems.some((item) => item.index === idx);
      if (hasSelectedItem) {
        return true;
      }

      // Для кастомных локаций проверяем все поля
      return (
        loc.location &&
        loc.address &&
        loc.starttime &&
        loc.endtime &&
        isValidTime(loc.starttime) &&
        isValidTime(loc.endtime) &&
        isStartBeforeEnd(loc.starttime, loc.endtime)
      );
    });

    setIsDisabled(!valid);
  }, [locations, selectedItems]);

  console.log(selectedItems, "selectedItems");
  console.log(getItems, "getItems");
  console.log(locations, "locations");

  return (
    <>
      <div className="scrollbar-hidden flex flex-col overflow-y-auto pb-20">
        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            {Array.from({ length: length }).map((_, index) => (
              <div key={index}>
                <div className="text-xl font-bold">Этапы вечеринки *</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <input
                    value={locations[index]?.location || ""}
                    type="text"
                    placeholder="Название"
                    className="h-11 flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                    onChange={(e) => {
                      const newLocations = [...locations];
                      if (!newLocations[index]) {
                        newLocations[index] = { location: "", address: "" };
                      }
                      newLocations[index].location = e.target.value;
                      setLocations(newLocations);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleYandexSearch(index)}
                    disabled={
                      !locations[index]?.location?.trim() || searchAddress.isPending
                    }
                    className="flex h-11 items-center gap-2 rounded-[14px] bg-blue-500 px-3 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    title="Поиск в Яндекс картах"
                  >
                    {searchAddress.isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Map />
                    )}
                    <span className="text-sm">
                      {searchAddress.isPending ? "Поиск..." : "Maps"}
                    </span>
                  </button>
                </div>

                {/* Map + Search results */}
                {showYandexResults[index] && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3">
                    <div className="mb-3">
                      <YandexMap
                        center={[37.618423, 55.751244]}
                        zoom={10}
                        className="h-60 w-full overflow-hidden rounded-lg"
                        onLocationSelect={(coords) =>
                          handleMapLocationSelect(index, coords)
                        }
                        markers={extractMarkersFromSuggest()}
                      />
                    </div>
                    {searchAddress.data && (
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          Результаты поиска
                          {Array.isArray(searchAddress.data.results) && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({searchAddress.data.results.length} найдено)
                            </span>
                          )}
                        </h3>
                        <button
                          onClick={() =>
                            setShowYandexResults((prev) => ({ ...prev, [index]: false }))
                          }
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {searchAddress.data ? (
                      <div className="space-y-3">
                        {Array.isArray(searchAddress.data.results) ? (
                          searchAddress.data.results.map(
                            (result: any, resultIndex: number) => (
                              <div
                                key={resultIndex}
                                className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                                onClick={() => handleResultSelect(result, index)}
                              >
                                <div className="mb-2">
                                  <h4 className="text-base font-semibold text-gray-900">
                                    {typeof result.title === "string"
                                      ? result.title
                                      : result.title?.text || "Название не найдено"}
                                  </h4>
                                  {result.subtitle && (
                                    <p className="text-sm text-gray-600">
                                      {typeof result.subtitle === "string"
                                        ? result.subtitle
                                        : result.subtitle?.text || ""}
                                    </p>
                                  )}
                                </div>

                                {/* Теги */}
                                {result.tags && result.tags.length > 0 && (
                                  <div className="mb-3 flex flex-wrap gap-1">
                                    {result.tags.map((tag: string, tagIndex: number) => (
                                      <span
                                        key={tagIndex}
                                        className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Адрес */}
                                {result.address?.formatted_address && (
                                  <div className="mb-2">
                                    <p className="mb-1 text-xs text-gray-500">
                                      📍 Адрес:
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      {result.address.formatted_address}
                                    </p>
                                  </div>
                                )}

                                {/* Расстояние */}
                                {result.distance?.text && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                      📏 Расстояние:
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                      {result.distance.text}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ),
                          )
                        ) : (
                          <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">
                              Структура ответа неожиданная
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-sm text-gray-500">Ничего не найдено</p>
                        <p className="mt-1 text-xs text-gray-400">
                          Попробуйте изменить запрос
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="mb-2 text-xl font-bold">Адрес *</div>
                  <div
                    className="text-sm text-blue-500"
                    onClick={() => {
                      if (
                        selectedItems.length > 0 &&
                        selectedItems.map((item) => item.index).includes(index)
                      ) {
                        setSelectedItems(
                          selectedItems.filter((item) => item.index !== index),
                        );
                        setLocations(locations.filter((item) => item.index !== index));
                      } else {
                        setIsOpen(true);
                        setIndex(index);
                      }
                    }}
                  >
                    {selectedItems.length > 0 &&
                    selectedItems.map((item) => item.index).includes(index)
                      ? "Указать свою локацию"
                      : "Выбрать из афишы"}
                  </div>
                </div>
                {selectedItems.length > 0 &&
                selectedItems.map((item) => item.index).includes(index) ? (
                  getItems
                    .filter((item) => item.index === index)
                    .map((item) => (
                      <div className="flex items-center justify-start gap-2 py-4">
                        <div
                          className="flex h-6 w-6 items-start"
                          onClick={() => {
                            setSelectedItems(
                              selectedItems.filter(
                                (si) =>
                                  !(
                                    si.id === item.id &&
                                    si.type === item.type &&
                                    si.index === index
                                  ),
                              ),
                            );
                          }}
                        >
                          <Bin />
                        </div>
                        <img
                          src={item.image}
                          alt="image"
                          className="h-16 w-16 rounded-lg"
                        />
                        <div className="flex flex-col items-start justify-center">
                          <div className="text-sm font-bold">{item.title}</div>
                          <div className="text-sm">{item.type}</div>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <div>{item.date}</div>
                            <div>{item.location}</div>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div
                    key={index}
                    className="items-between flex flex-col justify-between gap-2"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="shrink-0 text-2xl font-bold">{index + 1}</div>
                      <input
                        type="text"
                        value={locations[index]?.address || ""}
                        placeholder="Адрес"
                        onChange={(e) => {
                          const newLocations = [...locations];
                          if (!newLocations[index]) {
                            newLocations[index] = { location: "", address: "" };
                          }
                          newLocations[index].address = e.target.value;
                          setLocations(newLocations);
                        }}
                        className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50 md:min-w-[300px]"
                      />
                    </div>

                    <div className="flex w-[calc(100%-40px)] flex-nowrap items-center gap-2">
                      <div
                        className=""
                        onClick={() => setLength(length > 2 ? length - 1 : length)}
                      >
                        <Bin />
                      </div>
                      <div className="flex w-full flex-1 gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Начало"
                            value={locations[index]?.starttime}
                            onChange={(e) => {
                              const newLocations = [...locations];
                              newLocations[index].starttime = e.target.value;
                              setLocations(newLocations);
                            }}
                            className="placeholder:pl- h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white pr-4 pl-10 text-sm text-black placeholder:text-black/50"
                          />
                          <div className="absolute top-1/2 left-3 -translate-y-1/2">
                            <Clocks />
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Завершение"
                            value={locations[index]?.endtime}
                            onChange={(e) => {
                              const newLocations = [...locations];
                              newLocations[index].endtime = e.target.value;
                              setLocations(newLocations);
                            }}
                            className="placeholder:pl- h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white pr-4 pl-10 text-sm text-black placeholder:text-black/50"
                          />
                          <div className="absolute top-1/2 left-3 -translate-y-1/2">
                            <Clocks />
                          </div>
                        </div>
                      </div>
                    </div>
                    {locations[index]?.starttime &&
                      !isValidTime(locations[index].starttime) && (
                        <div className="mt-1 text-sm text-red-500">
                          Неверный формат времени начала (ЧЧ:ММ)
                        </div>
                      )}
                    {locations[index]?.endtime &&
                      !isValidTime(locations[index].endtime) && (
                        <div className="mt-1 text-sm text-red-500">
                          Неверный формат времени завершения (ЧЧ:ММ)
                        </div>
                      )}
                    {locations[index]?.starttime &&
                      locations[index]?.endtime &&
                      isValidTime(locations[index].starttime) &&
                      isValidTime(locations[index].endtime) &&
                      !isStartBeforeEnd(
                        locations[index].starttime,
                        locations[index].endtime,
                      ) && (
                        <div className="mt-1 text-sm text-red-500">
                          Время завершения должно быть позже начала
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div
            className="mt-2 text-center text-[#9924FF]"
            onClick={() => setLength(length + 1)}
          >
            Добавить место
          </div>

          {/* {getItems.length > 0 && (
            <div className="flex flex-col items-start justify-center gap-2 py-4">
              {getItems.map((item) => (
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="flex h-6 w-6 items-start"
                    onClick={() => {
                      const newSelectedItems = [...selectedItems];
                      const filteredItems = newSelectedItems.filter(
                        (selectedItem) =>
                          selectedItem.id !== item.id && selectedItem.type !== item.type,
                      );
                      setSelectedItems(filteredItems);
                    }}
                  >
                    <Bin />
                  </div>
                  <img src={item.image} alt="image" className="h-16 w-16 rounded-lg" />
                  <div className="flex flex-col items-start justify-center">
                    <div className="text-sm font-bold">{item.title}</div>
                    <div className="text-sm">{item.type}</div>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <div>{item.date}</div>
                      <div>{item.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </div>
      </div>
      <EventsDrawer
        index={index}
        open={isOpen}
        onOpenChange={setIsOpen}
        setLocations={setLocations}
        setSelectedItems={setSelectedItems}
        selectedItems={selectedItems}
        data={data}
        setActiveFilter={setActiveFilter}
        activeFilter={activeFilter}
        locations={locations}
      />
    </>
  );
};
