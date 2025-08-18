import React from "react";
import { useDistances } from "~/hooks/useDistances";
import { useGeolocation } from "~/hooks/useGeolocation";
import { MeetCard } from "./MeetCard";

interface Meeting {
  id: number;
  name: string;
  location?: string;
  address?: string;
  date?: string;
  type?: string;
  image?: string;
  coordinates?: [number, number];
}

interface MeetingsWithDistancesProps {
  meetings: Meeting[];
  isNavigable?: boolean;
  onMeetClick?: (meeting: Meeting) => void;
  autoGetLocation?: boolean;
  showDistances?: boolean;
  sortByDistance?: boolean;
}

export const MeetingsWithDistances: React.FC<MeetingsWithDistancesProps> = ({
  meetings,
  isNavigable = true,
  onMeetClick,
  autoGetLocation = true,
  showDistances = true,
  sortByDistance = false,
}) => {
  const {
    coordinates: userLocation,
    getCurrentLocation,
    isSupported,
  } = useGeolocation({
    autoStart: autoGetLocation,
  });

  const { itemsWithDistances, sortedByDistance, hasUserLocation } = useDistances(
    userLocation,
    meetings.map((meeting) => ({
      ...meeting,
      id: meeting.id,
      coordinates: meeting.coordinates,
    })),
  );

  const displayMeetings =
    sortByDistance && hasUserLocation ? sortedByDistance : itemsWithDistances;

  return (
    <div className="space-y-4">
      {/* Статус геолокации */}
      {showDistances && isSupported && !hasUserLocation && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              📍 Разрешите доступ к местоположению, чтобы видеть расстояния до мест встреч
            </div>
            <button
              onClick={getCurrentLocation}
              className="text-sm font-medium text-blue-600 underline"
            >
              Разрешить
            </button>
          </div>
        </div>
      )}

      {/* Список встреч */}
      {displayMeetings.map((meetingWithDistance) => {
        // Извлекаем оригинальные данные встречи, исключая distanceInfo
        const { distanceInfo, ...meeting } = meetingWithDistance;
        return (
          <MeetCard
            key={meeting.id}
            meet={meeting as Meeting}
            isNavigable={isNavigable}
            distance={showDistances ? distanceInfo?.distance : undefined}
            onClick={() => onMeetClick?.(meeting as Meeting)}
          />
        );
      })}

      {displayMeetings.length === 0 && (
        <div className="py-8 text-center text-gray-500">Встречи не найдены</div>
      )}
    </div>
  );
};
