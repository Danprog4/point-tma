import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { FastMeet, FastMeetParticipant, User as UserType } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";
import { useTRPC } from "~/trpc/init/react";
import { CloseRed } from "./Icons/CloseRed";

interface FastMeetInfoProps {
  meet: FastMeet;
  currentUser: UserType | null;
}

export const FastMeetInfo = ({ meet, currentUser }: FastMeetInfoProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch all users to display participant names and photos
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  // Fetch participants for this fast meet
  const { data: participants } = useQuery(
    trpc.meetings.getFastMeetParticipants.queryOptions({ meetId: meet.id }),
  );

  // Mutations for accepting/declining participants
  const acceptFastMeet = useMutation(trpc.meetings.acceptFastMeet.mutationOptions());
  const declineFastMeet = useMutation(trpc.meetings.declineFastMeet.mutationOptions());

  // Check if current user is the organizer
  const isOrganizer = meet.userId === currentUser?.id;

  // Get organizer info
  const organizer = users?.find((user) => user.id === meet.userId);

  // Filter pending requests for organizer view
  const pendingRequests =
    participants?.filter((participant) => participant.status === "pending") || [];

  // Filter accepted participants
  const acceptedParticipants =
    participants?.filter((participant) => participant.status === "accepted") || [];

  // Handle accepting a participant request
  const handleAcceptRequest = (participant: FastMeetParticipant) => {
    if (!participant.userId) return;

    acceptFastMeet.mutate({ meetId: meet.id, userId: participant.userId });

    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.map((p) =>
          p.userId === participant.userId ? { ...p, status: "accepted" } : p,
        );
      },
    );
  };

  // Handle declining a participant request
  const handleDeclineRequest = (participant: FastMeetParticipant) => {
    if (!participant.userId) return;

    declineFastMeet.mutate({ meetId: meet.id, userId: participant.userId });

    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => p.userId !== participant.userId);
      },
    );
  };

  // Get user photo with fallback
  const getUserPhoto = (user: UserType | undefined) => {
    if (!user) return "/men.jpeg";
    return getImage(user, user.photo || "");
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Pending Requests Section - Only visible to organizer */}
      {isOrganizer && (
        <>
          <div className="mx-4 flex items-center justify-start text-xl font-bold">
            Входящие заявки
          </div>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((participant) => {
                const user = users?.find((u) => u.id === participant.userId);
                if (!user) return null;

                return (
                  <div key={participant.id} className="px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="cursor-pointer p-2"
                          onClick={() => handleDeclineRequest(participant)}
                        >
                          <CloseRed />
                        </div>
                        <img
                          src={getUserPhoto(user)}
                          alt={`${user.name} ${user.surname}`}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                        <div className="flex flex-col">
                          <div className="text-lg font-medium">
                            {user.name} {user.surname}
                          </div>
                          <div className="text-sm text-gray-500">{user.login}</div>
                        </div>
                      </div>
                      <div
                        className="flex cursor-pointer items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                        onClick={() => handleAcceptRequest(participant)}
                      >
                        <CheckIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 text-sm text-gray-500">Заявок на встречу пока нет</div>
          )}
        </>
      )}

      {/* Participants Section */}
      <div className="mx-4 flex items-center justify-start text-xl font-bold">
        Участники
      </div>

      {/* Organizer */}
      {organizer && (
        <div className="px-4">
          <div className="flex items-center gap-3">
            <img
              src={getUserPhoto(organizer)}
              alt={`${organizer.name} ${organizer.surname}`}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <div className="text-lg font-bold">
                {organizer.name} {organizer.surname}
              </div>
              <div className="text-sm text-gray-500">Организатор</div>
            </div>
          </div>
        </div>
      )}

      {/* Accepted Participants */}
      {acceptedParticipants.length > 0 && (
        <div className="space-y-4">
          {acceptedParticipants.map((participant) => {
            const user = users?.find((u) => u.id === participant.userId);
            if (!user) return null;

            return (
              <div key={participant.id} className="px-4">
                <div className="flex items-center gap-3">
                  <img
                    src={getUserPhoto(user)}
                    alt={`${user.name} ${user.surname}`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="text-lg font-bold">
                      {user.name} {user.surname}
                    </div>
                    <div className="text-sm text-gray-500">Участник</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No participants message */}
      {acceptedParticipants.length === 0 && (
        <div className="px-4 text-sm text-gray-500">Пока нет принятых участников</div>
      )}

      {/* Participants count info */}
      <div className="mx-4 rounded-lg bg-purple-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <span>Всего участников:</span>
          <span className="font-medium">
            {(organizer ? 1 : 0) + acceptedParticipants.length}
          </span>
        </div>
        {pendingRequests.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>Ожидают подтверждения:</span>
            <span className="font-medium text-orange-600">{pendingRequests.length}</span>
          </div>
        )}
      </div>
    </div>
  );
};
