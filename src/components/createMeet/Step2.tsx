import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { Map } from "~/components/Icons/Map";
import { YandexMap } from "~/components/YandexMap";

import { User } from "~/db/schema";
import { EventsDrawer } from "~/EventsDrawer";
import { useGeolocation } from "~/hooks/useGeolocation";
import {
  calculateDistanceFromCoords,
  formatDistance,
} from "~/lib/utils/calculateDistance";

import { Plus, X } from "lucide-react";
import { useTRPC } from "~/trpc/init/react";
import TimePicker from "../TimePicker";
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
  user,
  setSelectedItems,
  setIsDisabled,
  selectedItems,
  city,
  setCity,
  isFastMeet,
  requireCity = true,
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
      coordinates?: [number, number];
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
    coordinates?: [number, number];
  }[];
  length: number;
  setLength: (length: number) => void;
  user: User;
  setSelectedItems: React.Dispatch<
    React.SetStateAction<{ id: number; type: string; index: number }[]>
  >;
  setIsDisabled: (isDisabled: boolean) => void;
  selectedItems: { id: number; type: string; index: number }[];
  city: string;
  setCity: (city: string) => void;
  isFastMeet?: boolean;
  requireCity?: boolean;
}) => {
  const [type, setType] = useState<"one" | "multiple">("one");

  // Геолокация для расчета расстояний
  const { coordinates: userLocation } = useGeolocation({
    autoStart: true,
  });

  // Функция для извлечения координат из результата поиска
  const extractCoordinatesFromResult = (result: any): [number, number] | null => {
    try {
      // Способ 1: Из URI параметра ll
      if (result.uri) {
        const coords = result.uri.match(/ll=([^&]+)/)?.[1];
        if (coords) {
          const [lng, lat] = coords.split(",").map(Number);
          if (!isNaN(lng) && !isNaN(lat)) {
            return [lng, lat];
          }
        }
      }

      // Способ 2: Из поля coordinates
      if (
        result.coordinates &&
        Array.isArray(result.coordinates) &&
        result.coordinates.length === 2
      ) {
        const [lng, lat] = result.coordinates.map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          return [lng, lat];
        }
      }

      // Способ 3: Из geocode ответа
      const pos =
        result?.geocode?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
          ?.Point?.pos;
      if (typeof pos === "string") {
        const parts = pos.split(/\s+/).map(Number);
        if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
          return [parts[0], parts[1]]; // [longitude, latitude]
        }
      }

      // Способ 4: Из geometry
      if (
        result.geometry?.coordinates &&
        Array.isArray(result.geometry.coordinates) &&
        result.geometry.coordinates.length === 2
      ) {
        const [lng, lat] = result.geometry.coordinates.map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          return [lng, lat];
        }
      }

      // Способ 5: Из location
      if (result.location?.lat && result.location?.lng) {
        const lat = Number(result.location.lat);
        const lng = Number(result.location.lng);
        if (!isNaN(lng) && !isNaN(lat)) {
          return [lng, lat];
        }
      }

      return null;
    } catch (e) {
      return null;
    }
  };

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
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const trpc = useTRPC();
  const searchAddress = useMutation(trpc.yandex.suggest.mutationOptions());
  const reverseGeocode = useMutation(trpc.yandex.reverseGeocode.mutationOptions());

  useEffect(() => {
    if (!city && user.city) {
      setCity(user.city);
    }
  }, []);

  const filtersMap = {
    Все: "",
    Кино: "Кино",
    Вечеринки: "Вечеринка",
    Конференции: "Конференция",
    Нетворкинг: "Нетворкинг",
    Квесты: "Квест",
  };

  const { data: eventsData } = useQuery(trpc.event.getEvents.queryOptions());

  const filteredData = (category: string) => {
    return category === "Все"
      ? eventsData
      : eventsData?.filter(
          (event) => event.category === filtersMap[category as keyof typeof filtersMap],
        );
  };

  // Reconstruct selected афиша items (including user-created custom events) for non-custom locations in edit mode
  useEffect(() => {
    if (!eventsData || !Array.isArray(locations) || locations.length === 0) return;

    // Track already selected indices to avoid duplicates
    const existingByIndex: Record<number, { id: number; type: string }> = {};
    for (const si of selectedItems)
      existingByIndex[si.index] = { id: si.id, type: si.type };

    const inferred: { id: number; type: string; index: number }[] = [];

    locations.forEach((loc, idx) => {
      if (!loc) return;
      // Skip if this step is explicitly custom
      if (loc.isCustom) return;
      // Skip if already selected
      if (existingByIndex[idx]) return;

      const address = (loc.address || "").toLowerCase().trim();
      const title = (loc.location || "").toLowerCase().trim();
      if (!address && !title) return;

      let best: { id: number; type: string } | null = null;
      let bestScore = -1;

      for (const ev of eventsData) {
        const evLocation = (ev.location || "").toLowerCase();
        const evTitle = (ev.title || "").toLowerCase();

        let score = 0;
        if (address && evLocation && evLocation === address) score += 3;
        if (title && evTitle && evTitle === title) score += 2;
        if (title && evTitle && evTitle.includes(title)) score += 1;
        if (address && evLocation && evLocation.includes(address)) score += 1;

        if (score > bestScore) {
          bestScore = score;
          best = { id: ev.id as number, type: ev.type as string };
        }
      }

      // Require a decent score to avoid false positives
      if (best && bestScore >= 3) {
        inferred.push({ id: best.id, type: best.type, index: idx });
      }
    });

    if (inferred.length > 0) {
      setSelectedItems((prev) => {
        // Only add for indices that aren't already selected
        const prevByIndex = new Set(prev.map((p) => p.index));
        const additions = inferred.filter((i) => !prevByIndex.has(i.index));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    }
  }, [eventsData, locations]);

  const extractMarkersFromSuggest = (): Array<[number, number]> => {
    try {
      if (!searchAddress.data || !Array.isArray(searchAddress.data.results)) {
        return [];
      }

      const coords: Array<[number, number]> = [];
      for (const r of searchAddress.data.results) {
        // Try different possible paths for coordinates
        let pos =
          r?.geocode?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point
            ?.pos;

        if (!pos) {
          // Alternative path - sometimes coordinates are in different structure
          const featureMember =
            r?.geocode?.response?.GeoObjectCollection?.featureMember?.[0];
          if (featureMember) {
            pos = featureMember?.GeoObject?.Point?.pos;
          }
        }

        if (!pos && r?.coordinates) {
          // Maybe coordinates are directly in result
          if (Array.isArray(r.coordinates) && r.coordinates.length === 2) {
            coords.push([r.coordinates[0], r.coordinates[1]]);
            continue;
          }
        }

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
      return [];
    }
  };

  // Calculate center of found markers
  const calculateMarkersCenter = (
    markers: Array<[number, number]>,
  ): [number, number] | null => {
    if (markers.length === 0) return null;
    if (markers.length === 1) return markers[0];

    const avgLon = markers.reduce((sum, [lon]) => sum + lon, 0) / markers.length;
    const avgLat = markers.reduce((sum, [, lat]) => sum + lat, 0) / markers.length;

    return [avgLon, avgLat];
  };

  // When new results arrive, center map to markers
  useEffect(() => {
    const ms = extractMarkersFromSuggest();
    const center = calculateMarkersCenter(ms);
    if (center) {
      setMapCenter(center);
    }
  }, [searchAddress.data]);

  // Handle Yandex search
  const handleYandexSearch = (locationIndex: number) => {
    const searchValue = locations[locationIndex]?.location;
    if (searchValue?.trim()) {
      setShowYandexResults((prev) => ({ ...prev, [locationIndex]: true }));
      searchAddress.mutate({
        query: searchValue,
        city: city,
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
          // Mark as custom location (not from афиша)
          newLocations[locationIndex].isCustom = true;
          // Сохраняем координаты для isFastMeet
          if (isFastMeet) {
            newLocations[locationIndex].coordinates = [lng, lat];
          }

          setLocations(newLocations);

          // Clear selectedItems for this index if it was from афиша
          setSelectedItems((prev: { id: number; type: string; index: number }[]) =>
            prev.filter(
              (item: { id: number; type: string; index: number }) =>
                item.index !== locationIndex,
            ),
          );

          setShowYandexResults((prev) => ({ ...prev, [locationIndex]: false }));
          setGeocodeLoading((prev) => ({ ...prev, [locationIndex]: false }));
        },
        onError: (err) => {
          const newLocations = [...locations];
          if (!newLocations[locationIndex]) {
            newLocations[locationIndex] = { location: "", address: "" };
          }
          if (!newLocations[locationIndex].location) {
            newLocations[locationIndex].location = "Точка на карте";
          }
          newLocations[locationIndex].address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          // Mark as custom location (not from афиша)
          newLocations[locationIndex].isCustom = true;
          // Сохраняем координаты для isFastMeet
          if (isFastMeet) {
            newLocations[locationIndex].coordinates = [lng, lat];
          }

          setLocations(newLocations);

          // Clear selectedItems for this index if it was from афиша
          setSelectedItems((prev: { id: number; type: string; index: number }[]) =>
            prev.filter(
              (item: { id: number; type: string; index: number }) =>
                item.index !== locationIndex,
            ),
          );

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

    // Mark as custom location (not from афиша)
    newLocations[locationIndex].isCustom = true;

    // Сохраняем координаты для isFastMeet
    if (isFastMeet && result.coordinates) {
      newLocations[locationIndex].coordinates = result.coordinates;
    }

    setLocations(newLocations);

    // Clear selectedItems for this index if it was from афиша
    setSelectedItems((prev: { id: number; type: string; index: number }[]) =>
      prev.filter(
        (item: { id: number; type: string; index: number }) =>
          item.index !== locationIndex,
      ),
    );

    setShowYandexResults((prev) => ({ ...prev, [locationIndex]: false }));
  };

  // Helper functions for time validation
  const isValidTime = (time?: string): boolean => {
    if (!time) return false;
    const t = time.trim();
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);
  };

  // Helper function to safely parse time string to Date
  const parseTimeToDate = (timeString?: string): Date | null => {
    if (!timeString) return null;

    // If it's already in HH:MM format
    if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeString.trim())) {
      const today = new Date().toISOString().split("T")[0];
      const dateTimeString = `${today}T${timeString.trim()}:00`;
      const date = new Date(dateTimeString);
      return isNaN(date.getTime()) ? null : date;
    }

    // If it contains date information, try to parse it
    const date = new Date(timeString);
    return isNaN(date.getTime()) ? null : date;
  };

  const isStartBeforeEnd = (start?: string, end?: string): boolean => {
    if (!isValidTime(start) || !isValidTime(end)) return false;
    const [h1, m1] = start!.split(":").map(Number);
    const [h2, m2] = end!.split(":").map(Number);
    return h1 < h2 || (h1 === h2 && m1 < m2);
  };

  // Мемоизированный список результатов поиска с расстояниями
  const searchResultsWithDistances = useMemo(() => {
    if (!searchAddress.data?.results || !Array.isArray(searchAddress.data.results)) {
      return [];
    }

    return searchAddress.data.results
      .map((result: any) => {
        const coords = extractCoordinatesFromResult(result);
        const distance =
          userLocation && coords
            ? calculateDistanceFromCoords(userLocation, coords)
            : null;

        return {
          ...result,
          coordinates: coords,
          distance,
        };
      })
      .sort((a, b) => {
        // Сортируем по расстоянию: сначала ближайшие
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
  }, [searchAddress.data, userLocation]);

  const getItems = useMemo(() => {
    return selectedItems
      .map((selectedItem) => {
        const matched = eventsData?.find(
          (item) => item.id === selectedItem.id && item.type === selectedItem.type,
        );
        if (!matched) return null;
        return { ...matched, index: selectedItem.index };
      })
      .filter(
        (item): item is NonNullable<typeof eventsData>[0] & { index: number } =>
          item !== null,
      );
  }, [selectedItems, eventsData]);

  useEffect(() => {
    if (locations.length === 0) {
      setIsDisabled(true);
      return;
    }

    // Проверяем город (опционально)
    if (requireCity && !city.trim()) {
      setIsDisabled(true);
      return;
    }

    // Проверяем все локации
    const valid = locations.every((loc, idx) => {
      // Проверяем основные поля (обязательны для всех)
      const hasBasicInfo = loc.location?.trim() && loc.address?.trim();
      if (!hasBasicInfo) {
        return false;
      }

      // Для isFastMeet: обязательно должен быть выбран адрес из карты (isCustom=true) И время
      if (isFastMeet) {
        if (!loc.isCustom) {
          return false;
        }

        // Для FastMeet время обязательно
        const hasStartTime = loc.starttime?.trim();
        const hasEndTime = loc.endtime?.trim();

        if (!hasStartTime || !hasEndTime) {
          return false;
        }

        // Проверяем валидность времени
        if (!isValidTime(loc.starttime) || !isValidTime(loc.endtime)) {
          return false;
        }

        // Проверяем порядок времени
        if (!isStartBeforeEnd(loc.starttime, loc.endtime)) {
          return false;
        }

        return true;
      }

      // Проверяем обязательность времени в зависимости от источника
      const hasSelectedItem = selectedItems.some((item) => item.index === idx);
      const hasStartTime = loc.starttime?.trim();
      const hasEndTime = loc.endtime?.trim();

      if (hasSelectedItem) {
        // Для мест из афиши: время не обязательно, но если указано - должно быть валидным

        // Если время указано, проверяем его валидность
        if (hasStartTime && !isValidTime(loc.starttime)) {
          return false;
        }

        if (hasEndTime && !isValidTime(loc.endtime)) {
          return false;
        }

        // Если указаны оба времени, проверяем порядок
        if (hasStartTime && hasEndTime) {
          return isStartBeforeEnd(loc.starttime, loc.endtime);
        }

        // Место из афиши всегда валидно (время опционально)
        return true;
      } else {
        // Для кастомных мест: и starttime и endtime обязательны
        if (!hasStartTime || !hasEndTime) {
          return false;
        }

        return (
          isValidTime(loc.starttime) &&
          isValidTime(loc.endtime) &&
          isStartBeforeEnd(loc.starttime, loc.endtime)
        );
      }
    });

    setIsDisabled(!valid);
  }, [locations, selectedItems, city, isFastMeet, requireCity]);

  return (
    <>
      <div className="scrollbar-hidden flex flex-col overflow-y-auto px-4 pb-20">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Город *</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              type="text"
              placeholder="Введите город"
              className="h-12 w-full rounded-2xl border-none bg-white px-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-4">
            {Array.from({ length: length }).map((_, index) => (
              <div
                key={index}
                className="relative rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                      {index + 1}
                    </div>
                    <span className="font-bold text-gray-900">Этап встречи</span>
                  </div>
                  {length > 1 && (
                    <button
                      onClick={() => {
                        // Remove from locations
                        const newLocations = locations.filter((_, i) => i !== index);
                        setLocations(newLocations);

                        // Remove and reindex selectedItems after the removed index
                        setSelectedItems((prev) =>
                          prev
                            .filter((si) => si.index !== index)
                            .map((si) =>
                              si.index > index ? { ...si, index: si.index - 1 } : si,
                            ),
                        );

                        // Decrease steps count
                        setLength(length - 1);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Bin />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      value={locations[index]?.location || ""}
                      type="text"
                      placeholder="Название места"
                      className="h-12 flex-1 rounded-2xl border-none bg-gray-50 px-4 text-sm text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      onChange={(e) => {
                        const newLocations = [...locations];
                        if (!newLocations[index]) {
                          newLocations[index] = { location: "", address: "" };
                        }
                        newLocations[index].location = e.target.value;
                        newLocations[index].isCustom = true;
                        setLocations(newLocations);

                        if (
                          e.target.value.trim() &&
                          selectedItems.some((item) => item.index === index)
                        ) {
                          setSelectedItems(
                            (prev: { id: number; type: string; index: number }[]) =>
                              prev.filter(
                                (item: { id: number; type: string; index: number }) =>
                                  item.index !== index,
                              ),
                          );
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleYandexSearch(index)}
                      disabled={
                        !locations[index]?.location?.trim() || searchAddress.isPending
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white transition-all hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200"
                    >
                      {searchAddress.isPending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Map />
                      )}
                    </button>
                  </div>

                  {showYandexResults[index] && (
                    <div className="overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200">
                      <div className="relative h-60 w-full">
                        <YandexMap
                          center={mapCenter || undefined}
                          zoom={10}
                          className="h-full w-full"
                          enableGeolocation={true}
                          autoGeolocation={!mapCenter}
                          preventClickSelection={true}
                          showSelectButton={true}
                          onLocationSelect={(coords) =>
                            handleMapLocationSelect(index, coords)
                          }
                          onGeolocationSuccess={() => {}}
                          markers={extractMarkersFromSuggest()}
                        />
                        <button
                          onClick={() =>
                            setShowYandexResults((prev) => ({ ...prev, [index]: false }))
                          }
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md active:scale-95"
                        >
                          <X className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      {searchAddress.data && (
                        <div className="max-h-60 overflow-y-auto p-2">
                          <div className="space-y-2">
                            {searchResultsWithDistances.length > 0 ? (
                              searchResultsWithDistances.map(
                                (result: any, resultIndex: number) => (
                                  <div
                                    key={resultIndex}
                                    className="cursor-pointer rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 transition-all hover:ring-blue-200 active:scale-[0.98]"
                                    onClick={() => handleResultSelect(result, index)}
                                  >
                                    <h4 className="font-bold text-gray-900 text-sm">
                                      {typeof result.title === "string"
                                        ? result.title
                                        : result.title?.text || "Без названия"}
                                    </h4>
                                    {result.address?.formatted_address && (
                                      <p className="mt-1 text-xs text-gray-500">
                                        {result.address.formatted_address}
                                      </p>
                                    )}
                                  </div>
                                ),
                              )
                            ) : (
                              <div className="p-4 text-center text-sm text-gray-500">
                                Ничего не найдено
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isFastMeet && (
                    <div className="flex gap-2">
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
                          newLocations[index].isCustom = true;
                          setLocations(newLocations);

                          if (
                            e.target.value.trim() &&
                            selectedItems.some((item) => item.index === index)
                          ) {
                            setSelectedItems(
                              (prev: { id: number; type: string; index: number }[]) =>
                                prev.filter(
                                  (item: { id: number; type: string; index: number }) =>
                                    item.index !== index,
                                ),
                            );
                          }
                        }}
                        className="h-12 w-full rounded-2xl border-none bg-gray-50 px-4 text-sm text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="flex-1 overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-violet-500 focus-within:bg-white">
                      <TimePicker
                        value={parseTimeToDate(locations[index]?.starttime)}
                        setTime={(time) => {
                          const timeString = time.toTimeString().slice(0, 5);
                          if (locations[index]?.starttime === timeString) return;
                          const newLocations = [...locations];
                          if (!newLocations[index])
                            newLocations[index] = {
                              location: "",
                              address: "",
                              starttime: "",
                              endtime: "",
                            };
                          newLocations[index].starttime = timeString;
                          setLocations(newLocations);
                        }}
                        placeholder="Начало *"
                        className="w-full border-none bg-transparent h-12 px-3 text-center outline-none"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-violet-500 focus-within:bg-white">
                      <TimePicker
                        value={parseTimeToDate(locations[index]?.endtime)}
                        setTime={(time) => {
                          const timeString = time.toTimeString().slice(0, 5);
                          if (locations[index]?.endtime === timeString) return;
                          const newLocations = [...locations];
                          if (!newLocations[index])
                            newLocations[index] = {
                              location: "",
                              address: "",
                              starttime: "",
                              endtime: "",
                            };
                          newLocations[index].endtime = timeString;
                          setLocations(newLocations);
                        }}
                        placeholder="Конец *"
                        className="w-full border-none bg-transparent h-12 px-3 text-center outline-none"
                      />
                    </div>
                  </div>

                  {!isFastMeet && (
                    <div className="flex justify-end">
                      <button
                        className="text-sm font-medium text-violet-600 hover:text-violet-700"
                        onClick={() => {
                          setIsOpen(true);
                          setIndex(index);
                        }}
                      >
                        Выбрать из афиши
                      </button>
                    </div>
                  )}

                  {selectedItems.some((item) => item.index === index) && (
                    <div className="mt-2 rounded-xl bg-violet-50 p-3">
                      {getItems
                        .filter((item) => item.index === index)
                        .map((item) => (
                          <div
                            key={`${item.id}-${item.type}`}
                            className="flex items-center gap-3"
                          >
                            <img
                              src={item.image ?? ""}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-sm text-gray-900">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500">{item.location}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setLength(length + 1)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 py-4 font-bold text-violet-600 transition-colors hover:border-violet-300 hover:bg-violet-100 active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            Добавить место
          </button>
        </div>
      </div>
      <EventsDrawer
        index={index}
        open={isOpen}
        onOpenChange={setIsOpen}
        setLocations={setLocations}
        setSelectedItems={setSelectedItems}
        selectedItems={selectedItems}
        data={filteredData(activeFilter) ?? []}
        setActiveFilter={setActiveFilter}
        activeFilter={activeFilter}
        locations={locations}
      />
    </>
  );
};
