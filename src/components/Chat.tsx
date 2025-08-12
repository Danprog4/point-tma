import { format } from "date-fns";
import { getImageUrl } from "~/lib/utils/getImageURL";

export const Chat = ({
  meeting,
  chatMessages,
  users,
  user,
  navigate,
  chatBottomRef,
}: any) => {
  return (
    <div className="flex flex-col overflow-y-hidden">
      <div className="h-[54vh] w-full space-y-2 overflow-y-auto rounded-t-2xl bg-[#EBF1FF] p-4">
        {chatMessages?.map((m: any) => {
          const sender = users?.find((u: any) => u.id === m.userId);
          const isCurrentUser = sender?.id === user?.id;
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              {!isCurrentUser && (
                <img
                  src={getImageUrl(sender?.photo || "")}
                  alt=""
                  onClick={() => {
                    navigate({
                      to: "/user-profile/$id",
                      params: {
                        id: sender?.id?.toString() || "",
                      },
                    });
                  }}
                  className="h-[30px] w-[30px] rounded-lg"
                />
              )}
              <div
                className={`relative flex w-[60%] flex-col gap-0.5 rounded-lg px-2 pt-2 pb-4 ${
                  isCurrentUser ? "bg-[#FFF7D7]" : "bg-[#A3BDFF]"
                }`}
              >
                <span className="text-xs text-gray-600">
                  {sender?.name} {sender?.surname}
                </span>
                <span className="text-sm text-black">{m.message}</span>
                <div className="absolute right-2 bottom-2 text-xs text-gray-600">
                  {format(new Date(m.createdAt), "HH:mm")}
                </div>
              </div>
              {isCurrentUser && (
                <img
                  src={getImageUrl(sender?.photo || "")}
                  alt=""
                  onClick={() => {
                    navigate({
                      to: "/profile",
                    });
                  }}
                  className="h-[30px] w-[30px] rounded-lg"
                />
              )}
            </div>
          );
        })}
        {/* Dummy element to anchor the scroll position at the bottom */}
        <div ref={chatBottomRef} />
      </div>
    </div>
  );
};
