import { useMemo } from "react";
import {
  calculateDistanceFromCoords,
  formatDistance,
} from "~/lib/utils/calculateDistance";

interface LocationItem {
  id?: string | number;
  coordinates?: [number, number];
  location?: string;
  address?: string;
  lat?: number;
  lng?: number;
  longitude?: number;
  latitude?: number;
}

interface DistanceInfo {
  distance: number;
  formattedDistance: string;
}

export const useDistances = (
  userLocation: [number, number] | null,
  items: LocationItem[],
) => {
  const itemsWithDistances = useMemo(() => {
    if (!userLocation) {
      return items.map((item) => ({ ...item, distanceInfo: null }));
    }

    return items.map((item) => {
      // Пытаемся извлечь координаты из разных возможных форматов
      let itemCoords: [number, number] | null = null;

      if (item.coordinates) {
        itemCoords = item.coordinates;
      } else if (item.lat && item.lng) {
        itemCoords = [item.lng, item.lat];
      } else if (item.latitude && item.longitude) {
        itemCoords = [item.longitude, item.latitude];
      }

      if (!itemCoords) {
        return { ...item, distanceInfo: null };
      }

      const distance = calculateDistanceFromCoords(userLocation, itemCoords);
      const distanceInfo: DistanceInfo = {
        distance,
        formattedDistance: formatDistance(distance),
      };

      return {
        ...item,
        distanceInfo,
      };
    });
  }, [userLocation, items]);

  // Сортировка по расстоянию
  const sortedByDistance = useMemo(() => {
    return [...itemsWithDistances].sort((a, b) => {
      if (!a.distanceInfo && !b.distanceInfo) return 0;
      if (!a.distanceInfo) return 1;
      if (!b.distanceInfo) return -1;
      return a.distanceInfo.distance - b.distanceInfo.distance;
    });
  }, [itemsWithDistances]);

  // Ближайший элемент
  const nearest = useMemo(() => {
    return sortedByDistance.find((item) => item.distanceInfo !== null) || null;
  }, [sortedByDistance]);

  return {
    itemsWithDistances,
    sortedByDistance,
    nearest,
    hasUserLocation: !!userLocation,
  };
};
