import { useQuery } from "@tanstack/react-query";
import { User as UserType } from "~/db/schema";
import { useFastMeet } from "~/hooks/useFastMeet";
import { getImage } from "~/lib/utils/getImage";
import { useTRPC } from "~/trpc/init/react";

interface FastMeetParticipantsListProps {
  meetId: number;
  currentUser: UserType | null;
}

export const FastMeetParticipantsList = ({
  meetId,
  currentUser,
}: FastMeetParticipantsListProps) => {
  const {
    isOrganizer,
    organizer,
    pendingRequests,
    acceptedParticipants,
    handleAcceptRequest,
    handleDeclineRequest,
  } = useFastMeet(meetId);

  const trpc = useTRPC();
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  // Get user photo with fallback
  const getUserPhoto = (user: UserType | undefined) => {
    if (!user) return "/men.jpeg";
    return getImage(user, user.photo || "");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Pending Requests Section - Only visible to organizer */}
      {isOrganizer && (
        <>
          <div className="flex items-center justify-start text-lg font-semibold text-gray-900">
            Входящие заявки
          </div>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((participant) => {
                const user = users?.find((u) => u.id === participant.userId);
                if (!user) return null;

                return (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDeclineRequest(participant)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
                      >
                        ✕
                      </button>
                      <img
                        src={getUserPhoto(user)}
                        alt={`${user.name} ${user.surname}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">
                          {user.name} {user.surname}
                        </div>
                        <div className="text-sm text-gray-500">{user.login}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptRequest(participant)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600"
                    >
                      ✓
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Заявок на встречу пока нет</div>
          )}
        </>
      )}

      {/* Participants Section */}
      <div className="flex items-center justify-start text-lg font-semibold text-gray-900">
        Участники
      </div>

      {/* Organizer */}
      {organizer && (
        <div className="flex items-center gap-3">
          <img
            src={getUserPhoto(organizer)}
            alt={`${organizer.name} ${organizer.surname}`}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <div className="font-medium text-gray-900">
              {organizer.name} {organizer.surname}
            </div>
            <div className="text-sm text-gray-500">Организатор</div>
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
              <div key={participant.id} className="flex items-center gap-3">
                <img
                  src={getUserPhoto(user)}
                  alt={`${user.name} ${user.surname}`}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <div className="font-medium text-gray-900">
                    {user.name} {user.surname}
                  </div>
                  <div className="text-sm text-gray-500">Участник</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No participants message */}
      {acceptedParticipants.length === 0 && (
        <div className="text-sm text-gray-500">Пока нет принятых участников</div>
      )}

      {/* Participants count info */}
      <div className="rounded-lg bg-blue-100 p-4">
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
