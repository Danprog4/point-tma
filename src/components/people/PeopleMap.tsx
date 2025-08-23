import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  preOpenCameFromList?: boolean;
  setIsList?: (isList: boolean) => void;
}

export const PeopleMap = ({
  users,
  currentUser,
  fastMeets = [],
  className,
  preOpenFastMeetId,
  preOpenCameFromList,
  setIsList,
}: PeopleMapProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(preOpenFastMeetId ? true : false);
  const [meet, setMeet] = useState<FastMeet | null>(
    preOpenFastMeetId ? fastMeets?.find((m) => m.id === preOpenFastMeetId) || null : null,
  );
  const [isMeetsListOpen, setIsMeetsListOpen] = useState(false);
  const [meetingsAtLocation, setMeetingsAtLocation] = useState<FastMeet[]>([]);
  const [cameFromList, setCameFromList] = useState(false);
  const trpc = useTRPC();

  // Prepare data for list restoration when returning from settings
  useEffect(() => {
    if (preOpenCameFromList && preOpenFastMeetId && fastMeets?.length > 0) {
      const targetMeet = fastMeets.find((m) => m.id === preOpenFastMeetId);

      if (targetMeet?.coordinates) {
        const meetingsAtSameLocation = fastMeets.filter(
          (m) =>
            m.coordinates &&
            m.coordinates[0] === targetMeet.coordinates[0] &&
            m.coordinates[1] === targetMeet.coordinates[1],
        );

        if (meetingsAtSameLocation.length > 1) {
          setMeetingsAtLocation(meetingsAtSameLocation);
          setCameFromList(true);
        } else {
          setIsOpen(true);
          setMeet(targetMeet);
        }
      }
    }
  }, [preOpenCameFromList, preOpenFastMeetId, fastMeets]);
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
      setCameFromList(false); // Reset flag when coming from direct marker click
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

  const handleButtonClick = (meet: FastMeet) => {
    setIsOpen(true);
    setMeet(meet);
    setCameFromList(false); // Reset flag when coming from button

    const isUsersMeet = meet?.userId === currentUser?.id;
    console.log(`${isUsersMeet ? "🟢" : "🟣"} Клик на быструю встречу:`, {
      id: meet.id,
      name: meet.name,
      description: meet.description,
      coordinates: meet.coordinates,
      createdAt: meet.createdAt,
      locations: meet.locations,
      isUsersMeet,
    });
  };

  // Handle meeting selection from list
  const handleMeetingSelect = (selectedMeet: FastMeet) => {
    setIsMeetsListOpen(false);
    setIsOpen(true);
    setMeet(selectedMeet);
    setCameFromList(true);
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
        action: () => handleButtonClick(userFastMeet),
        className: "bg-green-500",
      };
    } else if (userParticipation?.status === "accepted") {
      return {
        text: "Моя встреча",
        action: () => handleButtonClick(userFastMeet),
        className: "bg-green-500",
      };
    } else if (userParticipation?.status === "pending") {
      return {
        text: "Моя встреча",
        action: () => handleButtonClick(userFastMeet),
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
      // Use the first meeting for click handling
      const firstMeet = meetings[0];
      const user = users.find((u) => u.id === firstMeet.userId);

      // Check if user has any involvement with any meeting at this location
      let color = "#9924FF"; // Default purple for other meets
      let hasUserInvolvement = false;
      let hasUserOwnMeet = false;
      let hasPendingRequest = false;

      // Check all meetings at this location for user involvement
      meetings.forEach((meet) => {
        const isUsersMeet = meet.userId === currentUser?.id;
        const userParticipation = allParticipants?.find(
          (p) => p.userId === user?.id && p.meetId === meet.id,
        );

        if (isUsersMeet) {
          hasUserOwnMeet = true;
          hasUserInvolvement = true;
        } else if (userParticipation?.status === "accepted") {
          hasUserInvolvement = true;
        } else if (userParticipation?.status === "pending") {
          hasPendingRequest = true;
        }
      });

      // Determine color based on user involvement
      if (hasUserOwnMeet) {
        color = "#10B981"; // Green for user's own meets (highest priority)
      } else if (hasUserInvolvement) {
        color = "#10B981"; // Green for accepted participation
      } else if (hasPendingRequest) {
        color = "#FF6B35"; // Orange for pending requests
      }

      // Show number of meetings at this location instead of participants count
      const meetingsCount = meetings.length;

      return {
        coordinates: firstMeet.coordinates as [number, number],
        label:
          meetings.length > 1
            ? `${meetings.length} встречи`
            : firstMeet.name || "Быстрая встреча",
        onClick: () => handleFastMeetClick(firstMeet),
        meetData: firstMeet, // Сохраняем данные первой встречи для обработки клика
        color,
        userPhoto: user?.photo,
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
    currentUser: currentUser?.photo,

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

  // Debug markers with userPhoto
  console.log("🗺️ PeopleMap Markers Debug:", {
    fastMeetMarkers: fastMeetMarkers.map((marker) => ({
      coordinates: marker.coordinates,
      label: marker.label,
      hasUserPhoto: !!marker.userPhoto,
      userPhoto: marker.userPhoto,
      color: marker.color,
    })),
    allMarkers: allMarkers.map((marker) => ({
      coordinates: marker.coordinates,
      label: marker.label,
      hasUserPhoto: !!marker.userPhoto,
      userPhoto: marker.userPhoto,
      color: marker.color,
    })),
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
        enableClustering={true} // Включаем кластеризацию для лучшей производительности
        clusterGridSize={80} // Размер сетки кластеризации в пикселях
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
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open && cameFromList) {
            setCameFromList(false);
            setIsMeetsListOpen(true);
          }
        }}
        meet={meet}
        currentUser={currentUser}
        preOpenFastMeetId={preOpenFastMeetId}
        cameFromList={cameFromList}
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
