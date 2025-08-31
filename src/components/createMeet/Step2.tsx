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
      console.warn("Ошибка при извлечении координат:", e);
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

  const extractMarkersFromSuggest = (): Array<[number, number]> => {
    try {
      console.log("🗺️ Step2: extracting markers from", searchAddress.data);
      if (!searchAddress.data || !Array.isArray(searchAddress.data.results)) {
        console.log("🗺️ Step2: no search data or results");
        return [];
      }

      const coords: Array<[number, number]> = [];
      for (const r of searchAddress.data.results) {
        console.log("🗺️ Step2: full result structure", JSON.stringify(r, null, 2));

        // Try different possible paths for coordinates
        let pos =
          r?.geocode?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point
            ?.pos;

        if (!pos) {
          // Alternative path - sometimes coordinates are in different structure
          const featureMember =
            r?.geocode?.response?.GeoObjectCollection?.featureMember?.[0];
          if (featureMember) {
            console.log("🗺️ Step2: featureMember", featureMember);
            pos = featureMember?.GeoObject?.Point?.pos;
          }
        }

        if (!pos && r?.coordinates) {
          // Maybe coordinates are directly in result
          console.log("🗺️ Step2: using direct coordinates", r.coordinates);
          if (Array.isArray(r.coordinates) && r.coordinates.length === 2) {
            coords.push([r.coordinates[0], r.coordinates[1]]);
            continue;
          }
        }

        console.log("🗺️ Step2: found pos", pos);
        if (typeof pos === "string") {
          const parts = pos.split(/\s+/).map((x: string) => parseFloat(x));
          if (parts.length === 2 && parts.every((n: number) => Number.isFinite(n))) {
            // Yandex returns "lon lat" string; keep [lon, lat]
            coords.push([parts[0], parts[1]]);
            console.log("🗺️ Step2: added coordinate", [parts[0], parts[1]]);
          }
        }
      }
      console.log("🗺️ Step2: final extracted markers", coords);
      return coords;
    } catch (e) {
      console.warn("extractMarkersFromSuggest error", e);
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

    console.log("🗺️ Step2: calculated center", [avgLon, avgLat]);
    return [avgLon, avgLat];
  };

  // When new results arrive, center map to markers
  useEffect(() => {
    console.log("🗺️ Step2: search data changed", searchAddress.data);
    const ms = extractMarkersFromSuggest();
    const center = calculateMarkersCenter(ms);
    if (center) {
      console.log("🗺️ Step2: setting map center to", center);
      setMapCenter(center);
    } else {
      console.log("🗺️ Step2: no center calculated, markers:", ms);
    }
  }, [searchAddress.data]);

  // Handle Yandex search
  const handleYandexSearch = (locationIndex: number) => {
    const searchValue = locations[locationIndex]?.location;
    if (searchValue?.trim()) {
      console.log("🗺️ Step2: searching with", { query: searchValue, city: city });
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
          console.error("reverseGeocode error", err);
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
      console.log(
        "🗺️ FastMeet: сохранили координаты",
        result.coordinates,
        "для места",
        title,
      );
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
        console.log(`❌ Location ${idx}: Missing basic info`, loc);
        return false;
      }

      // Для isFastMeet: обязательно должен быть выбран адрес из карты (isCustom=true) И время
      if (isFastMeet) {
        if (!loc.isCustom) {
          console.log(`❌ FastMeet Location ${idx}: Must be selected from map`, loc);
          return false;
        }

        // Для FastMeet время обязательно
        const hasStartTime = loc.starttime?.trim();
        const hasEndTime = loc.endtime?.trim();

        if (!hasStartTime || !hasEndTime) {
          console.log(`❌ FastMeet Location ${idx}: Missing time`, {
            hasStartTime: !!hasStartTime,
            hasEndTime: !!hasEndTime,
          });
          return false;
        }

        // Проверяем валидность времени
        if (!isValidTime(loc.starttime) || !isValidTime(loc.endtime)) {
          console.log(`❌ FastMeet Location ${idx}: Invalid time format`);
          return false;
        }

        // Проверяем порядок времени
        if (!isStartBeforeEnd(loc.starttime, loc.endtime)) {
          console.log(`❌ FastMeet Location ${idx}: Start time must be before end time`);
          return false;
        }

        return true;
      }

      // Проверяем обязательность времени в зависимости от источника
      const hasSelectedItem = selectedItems.some((item) => item.index === idx);
      const hasStartTime = loc.starttime?.trim();
      const hasEndTime = loc.endtime?.trim();

      console.log(`🔍 Location ${idx}:`, {
        hasSelectedItem,
        hasStartTime: !!hasStartTime,
        hasEndTime: !!hasEndTime,
        location: loc,
      });

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

  console.log("🔍 Step2 Debug:", {
    selectedItems,
    locations,
    isDisabled,
    city,
  });

  return (
    <>
      <div className="scrollbar-hidden flex flex-col overflow-y-auto px-4 pb-20">
        <div className="flex flex-col">
          <div className="flex flex-col items-start gap-2 pb-4">
            <div className="text-xl font-bold">Город *</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              type="text"
              placeholder={`Введите город`}
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: length }).map((_, index) => (
              <div key={index}>
                <div className="text-xl font-bold">Этапы встречи *</div>
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
                      // Mark as custom when user manually edits
                      newLocations[index].isCustom = true;
                      setLocations(newLocations);

                      // Clear selectedItems for this index if user starts manual input
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
                        center={mapCenter || undefined}
                        zoom={10}
                        className="h-60 w-full overflow-hidden rounded-lg"
                        enableGeolocation={true}
                        autoGeolocation={!mapCenter} // Только если центр не задан
                        preventClickSelection={true} // Отключаем автовыбор при клике
                        showSelectButton={true} // Показываем кнопку выбора
                        onLocationSelect={(coords) =>
                          handleMapLocationSelect(index, coords)
                        }
                        onGeolocationSuccess={(coords) => {
                          // При успешной геолокации просто центрируем карту, но не выбираем адрес
                          console.log("🗺️ Step2: геолокация получена", coords);
                          // Можно добавить логику для центрирования карты или другие действия
                        }}
                        markers={extractMarkersFromSuggest()}
                      />
                    </div>
                    {searchAddress.data && (
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">
                          Результаты поиска
                          {searchResultsWithDistances.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({searchResultsWithDistances.length} найдено
                              {userLocation &&
                                `, ${searchResultsWithDistances.filter((r) => r.distance !== null).length} с расстоянием`}
                              )
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
                        {searchResultsWithDistances.length > 0 ? (
                          <>
                            {userLocation && (
                              <div className="mb-3 border-b pb-2 text-xs text-gray-500">
                                📍 Результаты отсортированы по расстоянию от вас
                              </div>
                            )}
                            {searchResultsWithDistances.map(
                              (result: any, resultIndex: number) => (
                                <div
                                  key={resultIndex}
                                  className={`cursor-pointer rounded-lg border p-4 shadow-sm transition-colors hover:bg-gray-50 ${
                                    resultIndex === 0 && result.distance !== null
                                      ? "border-green-200 bg-green-50"
                                      : "bg-white"
                                  }`}
                                  onClick={() => handleResultSelect(result, index)}
                                >
                                  <div className="mb-2">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                          {typeof result.title === "string"
                                            ? result.title
                                            : result.title?.text || "Название не найдено"}
                                          {resultIndex === 0 &&
                                            result.distance !== null && (
                                              <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                                🎯 Ближайший
                                              </span>
                                            )}
                                        </h4>
                                        {result.subtitle && (
                                          <p className="text-sm text-gray-600">
                                            {typeof result.subtitle === "string"
                                              ? result.subtitle
                                              : result.subtitle?.text || ""}
                                          </p>
                                        )}
                                      </div>
                                      <div className="ml-2 flex-shrink-0">
                                        {result.distance !== null ? (
                                          <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                                            📍 {formatDistance(result.distance)}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-gray-400">
                                            📍 н/д
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Теги */}
                                  {result.tags && result.tags.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1">
                                      {result.tags.map(
                                        (tag: string, tagIndex: number) => (
                                          <span
                                            key={tagIndex}
                                            className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                                          >
                                            {tag}
                                          </span>
                                        ),
                                      )}
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
                            )}
                          </>
                        ) : (
                          <div className="rounded-lg border bg-white p-4 shadow-sm">
                            <p className="text-sm text-gray-500">
                              Попробуйте изменить запрос
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
                  {!isFastMeet && (
                    <>
                      <div
                        className="cursor-pointer text-sm text-blue-500"
                        onClick={() => {
                          if (
                            selectedItems.length > 0 &&
                            selectedItems.map((item) => item.index).includes(index)
                          ) {
                            // Переключаемся на ручной ввод
                            setSelectedItems(
                              selectedItems.filter((item) => item.index !== index),
                            );
                            // Очищаем данные локации для ручного ввода
                            const newLocations = [...locations];
                            if (!newLocations[index]) {
                              newLocations[index] = { location: "", address: "" };
                            } else {
                              newLocations[index] = {
                                location: "",
                                address: "",
                                starttime: "",
                                endtime: "",
                                isCustom: true,
                              };
                            }
                            setLocations(newLocations);
                          } else {
                            // Переключаемся на выбор из афиши
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
                    </>
                  )}
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
                          src={item.image ?? ""}
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
                    {/* Показываем поле адреса только если это не FastMeet */}
                    {!isFastMeet && (
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
                            // Mark as custom when user manually edits
                            newLocations[index].isCustom = true;
                            setLocations(newLocations);

                            // Clear selectedItems for this index if user starts manual input
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
                          className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50 md:min-w-[300px]"
                        />
                      </div>
                    )}

                    {/* Для FastMeet показываем только выбранный адрес (если есть) */}
                    {isFastMeet && locations[index]?.address && (
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="shrink-0 text-2xl font-bold">{index + 1}</div>
                        <div className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-gray-100 px-4 py-3 text-sm text-gray-700 md:min-w-[300px]">
                          📍{" "}
                          {locations[index]?.address?.length > 30
                            ? `${locations[index]?.address.slice(0, 30)}...`
                            : locations[index]?.address}
                        </div>
                      </div>
                    )}

                    {/* Сообщение для FastMeet когда адрес не выбран */}
                    {isFastMeet && !locations[index]?.address && (
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="shrink-0 text-2xl font-bold">{index + 1}</div>
                        <div className="h-11 w-full flex-1 rounded-[14px] border border-dashed border-[#DBDBDB] bg-yellow-50 px-4 py-3 text-sm text-gray-600 md:min-w-[300px]">
                          🔍 Введите название места выше
                        </div>
                      </div>
                    )}

                    <div className="flex w-[calc(100%-40px)] flex-nowrap items-center gap-2">
                      <div
                        className=""
                        onClick={() => setLength(length > 1 ? length - 1 : length)}
                      >
                        <Bin />
                      </div>
                      <div className="flex w-full flex-1 gap-2">
                        <div className="flex-1">
                          <TimePicker
                            value={parseTimeToDate(locations[index]?.starttime)}
                            setTime={(time) => {
                              const timeString = time.toTimeString().slice(0, 5);

                              // Only update if the time actually changed
                              if (locations[index]?.starttime === timeString) {
                                return;
                              }

                              const newLocations = [...locations];
                              if (!newLocations[index]) {
                                newLocations[index] = {
                                  location: "",
                                  address: "",
                                  starttime: "",
                                  endtime: "",
                                };
                              }
                              newLocations[index].starttime = timeString;
                              // Don't mark as custom when editing time in afisha location
                              setLocations(newLocations);
                            }}
                            placeholder={
                              selectedItems.some((item) => item.index === index) ||
                              isFastMeet
                                ? "Начало *"
                                : "Начало *"
                            }
                          />
                        </div>
                        <div className="flex-1">
                          <TimePicker
                            value={parseTimeToDate(locations[index]?.endtime)}
                            setTime={(time) => {
                              const timeString = time.toTimeString().slice(0, 5);

                              // Only update if the time actually changed
                              if (locations[index]?.endtime === timeString) {
                                return;
                              }

                              const newLocations = [...locations];
                              if (!newLocations[index]) {
                                newLocations[index] = {
                                  location: "",
                                  address: "",
                                  starttime: "",
                                  endtime: "",
                                };
                              }
                              newLocations[index].endtime = timeString;
                              // Don't mark as custom when editing time in afisha location
                              setLocations(newLocations);
                            }}
                            placeholder={
                              selectedItems.some((item) => item.index === index) ||
                              isFastMeet
                                ? "Завершение *"
                                : "Завершение *"
                            }
                          />
                        </div>
                      </div>
                    </div>
                    {/* Показываем ошибки валидации времени */}

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
        data={filteredData(activeFilter) ?? []}
        setActiveFilter={setActiveFilter}
        activeFilter={activeFilter}
        locations={locations}
      />
    </>
  );
};
