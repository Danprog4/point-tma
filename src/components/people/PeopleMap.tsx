import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { YandexMap } from "~/components/YandexMap";
import { FastMeet } from "~/db/schema";
import { useFastMeet } from "~/hooks/useFastMeet";
import { useTRPC } from "~/trpc/init/react";
import FastMeetDrawer from "../FastMeetDrawer";
import FastMeetsListDrawer from "../FastMeetsListDrawer";

interface PeopleMapProps {
  users: any[]; // Not used for markers, only for potential future features
  currentUser: any; // Used for centering map and blue dot
  fastMeets?: any[]; // Used for purple markers
  className?: string;
  preOpenFastMeetId?: number;
}

export const PeopleMap = ({
  users,
  currentUser,
  fastMeets = [],
  className,
  preOpenFastMeetId,
}: PeopleMapProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(preOpenFastMeetId ? true : false);
  const [meet, setMeet] = useState<FastMeet | null>(
    preOpenFastMeetId ? fastMeets?.find((m) => m.id === preOpenFastMeetId) || null : null,
  );
  const [isMeetsListOpen, setIsMeetsListOpen] = useState(false);
  const [meetingsAtLocation, setMeetingsAtLocation] = useState<FastMeet[]>([]);
  const trpc = useTRPC();
  // Don't show other users as markers - only current user will be shown as blue dot by YandexMap
  const userMarkers: any[] = [];

  // Handle marker click for fast meets
  const handleFastMeetClick = (meet: any) => {
    // Check if there are multiple meetings at this location
    const meetingsAtSameLocation =
      fastMeets?.filter(
        (m) =>
          m.coordinates &&
          m.coordinates[0] === meet.coordinates[0] &&
          m.coordinates[1] === meet.coordinates[1],
      ) || [];

    if (meetingsAtSameLocation.length > 1) {
      // Show list of meetings
      setMeetingsAtLocation(meetingsAtSameLocation);
      setIsMeetsListOpen(true);
    } else {
      // Show single meeting
      setIsOpen(true);
      setMeet(meet);
    }

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
      meetingsAtSameLocation: meetingsAtSameLocation.length,
    });
  };

  // Handle meeting selection from list
  const handleMeetingSelect = (selectedMeet: FastMeet) => {
    setIsMeetsListOpen(false);
    setIsOpen(true);
    setMeet(selectedMeet);
  };

  const { data: allParticipants } = useQuery(
    trpc.meetings.getFastMeetParticipants.queryOptions({}),
  );

  // Find user's own fast meet (as organizer, accepted participant, or pending)
  const userFastMeet = fastMeets?.find((meet) => {
    // Check if user is the organizer
    if (meet.userId === currentUser?.id) {
      return true;
    }

    // Check if user is a participant (accepted or pending)
    const isParticipant = allParticipants?.some(
      (p) =>
        p.userId === currentUser?.id &&
        p.meetId === meet.id &&
        (p.status === "accepted" || p.status === "pending"),
    );

    return isParticipant;
  });

  // Determine button text and action based on user's meet status
  const getCheckInButtonConfig = () => {
    if (!userFastMeet) {
      return {
        text: "Check-In",
        action: () => navigate({ to: "/create-fastMeet" }),
        className: "bg-purple-600",
      };
    }

    const isOrganizer = userFastMeet.userId === currentUser?.id;
    const userParticipation = allParticipants?.find(
      (p) => p.userId === currentUser?.id && p.meetId === userFastMeet.id,
    );

    if (isOrganizer) {
      return {
        text: "Моя встреча",
        action: () => handleFastMeetClick(userFastMeet),
        className: "bg-green-500",
      };
    } else if (userParticipation?.status === "accepted") {
      return {
        text: "Моя встреча",
        action: () => handleFastMeetClick(userFastMeet),
        className: "bg-green-500",
      };
    } else if (userParticipation?.status === "pending") {
      return {
        text: "Моя встреча",
        action: () => handleFastMeetClick(userFastMeet),
        className: "bg-orange-600",
      };
    }

    // Fallback
    return {
      text: "Check-In",
      action: () => navigate({ to: "/create-fastMeet" }),
      className: "bg-purple-600",
    };
  };

  // Хук нужен только для кнопки Check-In, остальное FastMeetDrawer получит сам
  const {
    isBlocked,
    isParticipant,
    isAcceptedParticipant,
    isAlreadyOwner,
    handleJoinFastMeet,
  } = useFastMeet(meet?.id || 0);

  const buttonConfig = getCheckInButtonConfig();

  // Group meetings by coordinates to handle multiple meetings at the same location
  const meetingsByLocation = new Map<string, FastMeet[]>();

  fastMeets?.forEach((meet) => {
    if (meet.coordinates) {
      const coordKey = `${meet.coordinates[0]},${meet.coordinates[1]}`;
      if (!meetingsByLocation.has(coordKey)) {
        meetingsByLocation.set(coordKey, []);
      }
      meetingsByLocation.get(coordKey)!.push(meet);
    }
  });

  // Prepare fast meet markers - Green for user's own meets, red for pending, purple for others
  const fastMeetMarkers = Array.from(meetingsByLocation.entries()).map(
    ([coordKey, meetings]) => {
      // Use the first meeting for color determination and click handling
      const firstMeet = meetings[0];
      const isUsersMeet = firstMeet.userId === currentUser?.id;
      const userParticipation = allParticipants?.find(
        (p) => p.userId === currentUser?.id && p.meetId === firstMeet.id,
      );

      let color = "#9924FF"; // Default purple for other meets

      if (isUsersMeet) {
        color = "#10B981"; // Green for user's own meets
      } else if (userParticipation?.status === "accepted") {
        color = "#10B981"; // Green for accepted participation
      } else if (userParticipation?.status === "pending") {
        color = "#FF6B35"; // Orange for pending requests
      }

      // Show number of meetings at this location instead of participants count
      const meetingsCount = meetings.length;

      console.log("🗺️ PeopleMap: meetingsCount", meetingsCount, "at", coordKey);

      return {
        coordinates: firstMeet.coordinates as [number, number],
        label:
          meetings.length > 1
            ? `${meetings.length} встреч`
            : firstMeet.name || "Быстрая встреча",
        onClick: () => handleFastMeetClick(firstMeet),
        meetData: firstMeet, // Сохраняем данные первой встречи для обработки клика
        color,
        participantsCount: meetingsCount > 1 ? meetingsCount : undefined, // Only show count if multiple meetings
      };
    },
  );

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
    userFastMeet: userFastMeet
      ? {
          id: userFastMeet.id,
          name: userFastMeet.name,
          isOrganizer: userFastMeet.userId === currentUser?.id,
          participationStatus: allParticipants?.find(
            (p) => p.userId === currentUser?.id && p.meetId === userFastMeet.id,
          )?.status,
        }
      : null,
    buttonConfig: {
      text: buttonConfig.text,
      className: buttonConfig.className,
    },
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
          onClick={buttonConfig.action}
          className={`w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md ${buttonConfig.className} px-6 py-3 font-medium text-white shadow-lg transition-colors`}
        >
          {buttonConfig.text}
        </button>
      </div>
      <FastMeetDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        meet={meet}
        currentUser={currentUser}
        preOpenFastMeetId={preOpenFastMeetId}
      />
      <FastMeetsListDrawer
        open={isMeetsListOpen}
        onOpenChange={setIsMeetsListOpen}
        meetings={meetingsAtLocation}
        currentUser={currentUser}
        onMeetingSelect={handleMeetingSelect}
      />
    </div>
  );
};
