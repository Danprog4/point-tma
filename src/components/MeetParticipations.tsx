import { Check } from "./Icons/Check";
import { CloseRed } from "./Icons/CloseRed";

export const MeetParticipations = ({
  meeting,
  users,
  user,
  setIsDrawerOpen,
  getImageUrl,
  handleDeclineRequest,
  handleAcceptRequest,
  filteredRequests,
  invitedUsers,
  organizer,
  handleInvite,
}: {
  meeting: any;
  users: any;
  user: any;
  setIsDrawerOpen: (isDrawerOpen: boolean) => void;
  getImageUrl: (url: string) => string;
  handleDeclineRequest: (request: any) => void;
  handleAcceptRequest: (request: any) => void;
  filteredRequests: any;
  invitedUsers: any;
  organizer: any;
  handleInvite: (userIds: number[]) => void;
}) => {
  return (
    <div className="flex flex-col">
      {meeting?.userId === user?.id && (
        <button
          onClick={() => {
            setIsDrawerOpen(true);
          }}
          disabled={
            meeting?.maxParticipants !== undefined &&
            meeting?.maxParticipants !== null &&
            meeting?.maxParticipants <= (meeting?.participantsIds?.length || 0)
          }
          className="mx-4 flex items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#F8F0FF] px-4 py-3 text-[#721DBD]"
        >
          Пригласить участников
        </button>
      )}
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="items-cetner flex justify-between">
          <div>Количество участников</div>
          <div>
            {Number(meeting?.participantsIds?.length || 0)} из{" "}
            {meeting?.maxParticipants || "не ограничено"}
          </div>
        </div>
        <div className="h-1 w-full bg-[#9924FF]"></div>
      </div>
      {user?.id === meeting?.userId && (
        <>
          <div className="mx-4 flex items-center justify-start text-xl font-bold">
            Входящие заявки
          </div>
          {filteredRequests && filteredRequests?.length > 0 ? (
            filteredRequests?.map((r: any) => {
              const user = users?.find((u: any) => u.id === r.fromUserId);
              return (
                <div key={r?.id}>
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex items-center justify-start gap-2">
                      <div className="mr-4 p-2" onClick={() => handleDeclineRequest(r)}>
                        <CloseRed />
                      </div>
                      <img
                        src={getImageUrl(user?.photo || "")}
                        alt=""
                        className="h-14 w-14 rounded-lg"
                      />
                      <div className="flex flex-col items-start justify-between">
                        <div className="text-lg">
                          {user?.name} {user?.surname}
                        </div>
                        <div>{user?.login}</div>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                      onClick={() => handleAcceptRequest(r)}
                    >
                      <Check />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm text-neutral-500">
              Заявок на встречу пока нет
            </div>
          )}

          <div className="mx-4 flex items-center justify-start text-xl font-bold">
            Приглашения
          </div>
          {invitedUsers && invitedUsers.length > 0 ? (
            invitedUsers?.map((i: any) => {
              const user = users?.find((u: any) => u.id === i.toUserId);
              return (
                <div key={i.id + "r"}>
                  <div className="flex items-center justify-between px-4 py-4 pb-4">
                    <div className="flex items-center justify-start gap-2">
                      <img
                        src={getImageUrl(user?.photo || "")}
                        alt=""
                        className="h-14 w-14 rounded-lg"
                      />
                      <div className="flex flex-col items-start justify-between">
                        <div className="text-lg">
                          {user?.name} {user?.surname}
                        </div>
                        <div>{user?.login}</div>
                      </div>
                    </div>
                    {(() => {
                      const participantIds = Array.from(
                        new Set(
                          [organizer?.id, ...(meeting?.participantsIds || [])]
                            .map((id) => Number(id))
                            .filter(Boolean),
                        ),
                      );

                      if (participantIds.includes(user?.id || 0)) {
                        return (
                          <div className="text-sm text-nowrap text-[#00A349]">
                            Участник
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-sm text-nowrap text-[#FFA500]">
                            Приглашен(-а)
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-4 text-sm text-neutral-500">
              Никто не был приглашен на встречу
            </div>
          )}
        </>
      )}

      <div className="mx-4 flex items-center justify-start text-xl font-bold">
        Участники
      </div>

      {(() => {
        const participantIds = Array.from(
          new Set(
            [organizer?.id, ...(meeting?.participantsIds || [])]
              .map((id) => Number(id))
              .filter(Boolean),
          ),
        );
        return participantIds;
      })().map((p: any) => {
        const user = users?.find((u: any) => u.id === Number(p));
        return (
          <div key={`participant-${p}`} className="flex flex-col gap-2 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-gray-200">
                  {(() => {
                    const imgSrc = user?.photo ? getImageUrl(user.photo) : user?.photoUrl;
                    return imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={user?.name || ""}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : null;
                  })()}
                </div>
                <div className="flex flex-col">
                  <div className="text-lg font-bold">
                    {user?.name} {user?.surname}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user?.id === organizer?.id ? "Организатор" : "Участник"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
