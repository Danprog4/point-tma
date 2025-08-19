import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { YandexMap } from "~/components/YandexMap";
import { FastMeet } from "~/db/schema";
import FastMeetDrawer from "../FastMeetDrawer";

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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [meet, setMeet] = useState<FastMeet | null>(null);
  // Don't show other users as markers - only current user will be shown as blue dot by YandexMap
  const userMarkers: any[] = [];

  // Handle marker click for fast meets
  const handleFastMeetClick = (meet: any) => {
    setIsOpen(true);
    setMeet(meet);
    const isUsersMeet = meet.userId === currentUser?.id;
    console.log(`${isUsersMeet ? "🟢" : "🟣"} Клик на быструю встречу:`, {
      id: meet.id,
      name: meet.name,
      description: meet.description,
      coordinates: meet.coordinates,
      author: meet.author,
      createdAt: meet.createdAt,
      locations: meet.locations,
      isUsersMeet,
    });
  };

  // Prepare fast meet markers - Green for user's own meets, purple for others
  const fastMeetMarkers =
    fastMeets
      ?.filter((meet) => meet?.coordinates)
      .map((meet) => {
        const isUsersMeet = meet.userId === currentUser?.id;
        return {
          coordinates: meet.coordinates as [number, number],
          label: meet.name || "Быстрая встреча",
          onClick: () => handleFastMeetClick(meet),
          meetData: meet, // Сохраняем данные встречи для обработки клика
          color: isUsersMeet ? "#10B981" : "#9924FF", // Green for user's meets, purple for others
        };
      }) || [];

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
          onClick={() => {
            navigate({ to: "/create-fastMeet" });
          }}
          className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
        >
          Check-In
        </button>
      </div>
      <FastMeetDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        meet={meet}
        currentUser={currentUser}
      />
    </div>
  );
};
