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
  handleDeleteParticipant,
  isOwner,
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
  handleDeleteParticipant: (participantId: number) => void;
  isOwner: boolean;
}) => {
  return (
    <div className="flex flex-col gap-4 px-4 pb-24">
      {/* Invite Button for Owner */}
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
          className="flex w-full items-center justify-center rounded-2xl bg-purple-50 px-4 py-4 text-purple-700 font-bold transition-all hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Пригласить участников
        </button>
      )}
      
      {/* Stats Card */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-500">Количество участников</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">{Number(meeting?.participantsIds?.length || 0)}</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500 font-medium">{meeting?.maxParticipants || "∞"}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
             <div 
                className="h-full bg-purple-500 transition-all duration-500" 
                style={{ 
                    width: meeting?.maxParticipants 
                        ? `${Math.min(((meeting?.participantsIds?.length || 0) / meeting.maxParticipants) * 100, 100)}%` 
                        : '100%' 
                }} 
             />
        </div>
      </div>

      {user?.id === meeting?.userId && (
        <>
           {/* Incoming Requests */}
          <div className="flex flex-col gap-3">
             <div className="px-1 text-lg font-bold text-gray-900">Входящие заявки</div>
             {filteredRequests && filteredRequests?.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {filteredRequests?.map((r: any) => {
                    const user = users?.find((u: any) => u.id === r.fromUserId);
                    return (
                        <div key={r?.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                            <div className="flex items-center gap-4">
                                <img
                                    src={getImageUrl(user?.photo || "")}
                                    alt=""
                                    className="h-12 w-12 rounded-full object-cover bg-gray-100"
                                />
                                <div className="flex flex-col">
                                    <div className="font-bold text-gray-900">
                                    {user?.name} {user?.surname}
                                    </div>
                                    <div className="text-sm text-gray-500">@{user?.login}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-50 py-2.5 text-sm font-bold text-green-600 hover:bg-green-100 transition-colors"
                                    onClick={() => handleAcceptRequest(r)}
                                >
                                    <Check className="h-4 w-4" /> Принять
                                </button>
                                <button 
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
                                    onClick={() => handleDeclineRequest(r)}
                                >
                                    <CloseRed className="h-4 w-4" /> Отклонить
                                </button>
                            </div>
                        </div>
                    );
                    })}
                </div>
             ) : (
                <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-400 italic">
                  Заявок на встречу пока нет
                </div>
             )}
          </div>

           {/* Sent Invites */}
          <div className="flex flex-col gap-3 mt-4">
             <div className="px-1 text-lg font-bold text-gray-900">Приглашения</div>
             {invitedUsers && invitedUsers.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {invitedUsers?.map((i: any) => {
                    const user = users?.find((u: any) => u.id === i.toUserId);
                    const isParticipant = [organizer?.id, ...(meeting?.participantsIds || [])]
                            .map((id) => Number(id))
                            .filter(Boolean)
                            .includes(user?.id || 0);

                    return (
                        <div key={i.id + "r"} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getImageUrl(user?.photo || "")}
                                    alt=""
                                    className="h-10 w-10 rounded-full object-cover bg-gray-100"
                                />
                                <div className="flex flex-col">
                                    <div className="font-bold text-gray-900">
                                    {user?.name} {user?.surname}
                                    </div>
                                    <div className="text-xs text-gray-500">@{user?.login}</div>
                                </div>
                            </div>
                            <div>
                                {isParticipant ? (
                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                                        Участник
                                    </span>
                                ) : (
                                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                                        Приглашен
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                    })}
                </div>
             ) : (
                <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-400 italic">
                  Никто не был приглашен на встречу
                </div>
             )}
          </div>
        </>
      )}

      {/* Participants List */}
      <div className="flex flex-col gap-3 mt-4">
          <div className="px-1 text-lg font-bold text-gray-900">Список участников</div>
          <div className="flex flex-col gap-3">
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
                const isOrganizer = user?.id === organizer?.id;
                
                return (
                <div key={`participant-${p}`} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 ring-2 ring-white">
                            {(() => {
                            const imgSrc = user?.photo ? getImageUrl(user.photo) : user?.photoUrl;
                            return imgSrc ? (
                                <img
                                src={imgSrc}
                                alt={user?.name || ""}
                                className="h-full w-full rounded-full object-cover"
                                />
                            ) : null;
                            })()}
                        </div>
                        <div className="flex flex-col">
                            <div className="font-bold text-gray-900">
                                {user?.name} {user?.surname}
                            </div>
                            <div className="text-xs font-medium text-purple-600">
                                {isOrganizer ? "Организатор" : "Участник"}
                            </div>
                        </div>
                    </div>
                    {isOwner && !isOrganizer && (
                        <button
                            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                            onClick={() => handleDeleteParticipant(user?.id)}
                        >
                            Исключить
                        </button>
                    )}
                </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
