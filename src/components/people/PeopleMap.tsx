import { YandexMap } from "~/components/YandexMap";

interface PeopleMapProps {
  users: any[]; // Not used for markers, only for potential future features
  currentUser: any; // Used for centering map and blue dot
  fastMeets?: any[]; // Used for purple markers
  className?: string;
}

export const PeopleMap = ({
  users,
  currentUser,
  fastMeets = [],
  className,
}: PeopleMapProps) => {
  // Don't show other users as markers - only current user will be shown as blue dot by YandexMap
  const userMarkers: any[] = [];

  // Prepare fast meet markers (purple dots) - ONLY show fast meets, not users
  const fastMeetMarkers =
    fastMeets
      ?.filter((meet) => meet?.coordinates)
      .map((meet) => ({
        coordinates: meet.coordinates as [number, number],
        label: meet.name || "Быстрая встреча",
      })) || [];

  // Combine all markers
  const allMarkers = [...userMarkers, ...fastMeetMarkers];

  // Get current user location for centering and showing blue dot
  const currentLocation = currentUser?.coordinates as [number, number] | undefined;

  // Debug info
  console.log("🗺️ PeopleMap Debug:", {
    currentUser: currentUser?.name,
    currentLocation,
    fastMeetsWithCoords: fastMeets?.filter((m) => m?.coordinates).length,
    totalMarkers: allMarkers.length,
  });

  return (
    <div className={className}>
      <YandexMap
        center={currentLocation || [37.618423, 55.751244]} // Default to Moscow if no user location
        zoom={12}
        className="h-[500px] w-full rounded-lg"
        markersWithInfo={allMarkers}
        enableGeolocation={true}
        autoGeolocation={true} // Always enable auto-detection for blue dot
        showDistances={true}
        onGeolocationSuccess={(coords) => {
          // This could trigger saving user location to backend
          console.log("🔵 User location detected for blue dot:", coords);
        }}
      />

      <div className="fixed right-4 bottom-20 left-4">
        <button
          onClick={() => {}}
          className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
        >
          Откликнуться
        </button>
      </div>
    </div>
  );
};
