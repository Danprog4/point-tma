import { useEffect, useMemo, useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { EventsDrawer } from "~/EventsDrawer";
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

  let data: any[] = [];

  switch (activeFilter) {
    case "Все":
      data = [
        ...questsData,
        ...kinoData,
        ...conferencesData,
        ...networkingData,
        ...partiesData,
      ];
      break;
    case "Квесты":
      data = questsData;
      console.log(data);
      break;
    case "Кино":
      data = kinoData;
      break;
    case "Конференции":
      data = conferencesData;
      break;
    case "Вечеринки":
      data = partiesData;
      break;
    case "Нетворкинг":
      data = networkingData;
      break;
    default:
      data = [];
  }

  const all = [
    ...questsData,
    ...kinoData,
    ...conferencesData,
    ...networkingData,
    ...partiesData,
  ];

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
    }
  }, [locations]);

  useEffect(() => {
    console.log(locations, "locations");
    if (locations.length > 0) {
      setIsDisabled(false);
      return;
    }
    const valid = locations
      .filter((loc) => !loc.isCustom)
      .every(
        (loc) =>
          loc.location &&
          loc.starttime &&
          loc.endtime &&
          isValidTime(loc.starttime) &&
          isValidTime(loc.endtime) &&
          isStartBeforeEnd(loc.starttime, loc.endtime),
      );
    setIsDisabled(!valid);
  }, [locations]);
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
                <div className="text-xl font-bold">Этапы вечеринки</div>
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
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xl font-bold">Адрес</div>
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
