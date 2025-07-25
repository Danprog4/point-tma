export const Invite = ({
  friendName,
  setFriendName,
  selectedIds,
  setSelectedIds,
  friends,
  users,
  user,
  getImageUrl,
}: {
  friendName: string;
  setFriendName: (friendName: string) => void;
  selectedIds: number[];
  setSelectedIds: (selectedIds: number[]) => void;
  friends: any[];
  users: any[];
  user: any;
  getImageUrl: (url: string) => string;
}) => {
  return (
    <>
      <div className="mb-2 flex w-full gap-2 text-xl font-bold">Пригласите друга</div>
      <div className="mb-4 flex flex-col items-start gap-2">
        <input
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
          type="text"
          placeholder="Поиск"
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
        <div className="px-4 text-xs">Можете ввести фамилию или ник</div>
      </div>
      {friends && friends?.length > 0 && (
        <div className="flex flex-col gap-2">
          {users
            ?.filter((user) =>
              friendName
                ? user.name?.toLowerCase().includes(friendName.toLowerCase())
                : false,
            )
            .filter(
              (u) =>
                u !== undefined &&
                !friends?.some(
                  (friend) => friend.fromUserId === u.id || friend.toUserId === u.id,
                ),
            )
            .map((user) => {
              return (
                <div key={user.id}>
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center justify-start gap-2">
                      <img
                        src={getImageUrl(user?.photo || "")}
                        alt=""
                        className="h-14 w-14 rounded-lg"
                      />
                      <div className="flex flex-col items-start justify-between gap-2">
                        <div className="text-lg">
                          {user?.name} {user?.surname}
                        </div>
                        <div>{user?.birthday}</div>
                      </div>
                    </div>
                    {selectedIds.includes(user?.id || 0) ? (
                      <div
                        className="text-sm text-nowrap text-[#00A349]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds(
                            selectedIds.filter((id) => id !== user?.id || 0),
                          );
                        }}
                      >
                        Приглашен(-а)
                      </div>
                    ) : (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]"
                        onClick={(e) => {
                          e.stopPropagation();

                          setSelectedIds([...selectedIds, user?.id || 0]);
                        }}
                      >
                        <div className="pb-1 text-2xl leading-none font-bold text-[#721DBD]">
                          +
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          {friends
            ?.filter((request) => request.status === "accepted")
            .map((request) => {
              const requestUser = users?.find(
                (u) =>
                  u.id ===
                  (request.fromUserId === user?.id
                    ? request.toUserId
                    : request.fromUserId),
              );
              return (
                <div key={request.id}>
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center justify-start gap-2">
                      <img
                        src={getImageUrl(requestUser?.photo || "")}
                        alt=""
                        className="h-14 w-14 rounded-lg"
                      />
                      <div className="flex flex-col items-start justify-between gap-2">
                        <div className="text-lg">
                          {requestUser?.name} {requestUser?.surname}
                        </div>
                        <div>{requestUser?.birthday}</div>
                      </div>
                    </div>
                    {selectedIds.includes(requestUser?.id || 0) ? (
                      <div
                        className="text-sm text-nowrap text-[#00A349]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds(
                            selectedIds.filter((id) => id !== requestUser?.id || 0),
                          );
                        }}
                      >
                        Приглашен(-а)
                      </div>
                    ) : (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]"
                        onClick={(e) => {
                          e.stopPropagation();

                          setSelectedIds([...selectedIds, requestUser?.id || 0]);
                        }}
                      >
                        <div className="pb-1 text-2xl leading-none font-bold text-[#721DBD]">
                          +
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </>
  );
};
