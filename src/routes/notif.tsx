import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/notif")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: notifications } = useQuery(trpc.main.getNotifications.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const readNotification = useMutation(trpc.main.readNotification.mutationOptions());
  const { data: meetings } = useQuery(trpc.meetings.getMeetings.queryOptions());

  const getNotificationMessage = (type: string) => {
    switch (type) {
      case "like":
        return "Вам поставили лайк";
      case "subscribe":
        return "На вас подписались";
      case "friend request":
        return "Запрос в друзья";
      case "meet request":
        return "Запрос на встречу";
      case "meet invite":
        return "Приглашение на встречу";
    }
  };

  const getUser = (userId: number) => {
    return users?.find((user) => user.id === userId);
  };

  const getMeeting = (meetId: number) => {
    return meetings?.find((meet) => meet.id === meetId);
  };

  const getNotificationIcon = (type: string, notification: any) => {
    switch (type) {
      case "like":
        return <img src="/heart.png" alt="" className="h-12 w-12 rounded-xl" />;
      case "subscribe":
        return (
          <img
            src={getImageUrl(getUser(notification.fromUserId || 0)?.photo || "")}
            className="h-12 w-12 rounded-xl"
          />
        );
      case "friend request":
        return (
          <img
            src={getImageUrl(getUser(notification.fromUserId || 0)?.photo || "")}
            className="h-12 w-12 rounded-xl"
          />
        );
      case "meet request":
        return (
          <img
            src={getImageUrl(getMeeting(notification.meetId || 0)?.image || "")}
            className="h-12 w-12 rounded-xl"
          />
        );
      case "meet invite":
        return (
          <img
            src={getImageUrl(getMeeting(notification.meetId || 0)?.image || "")}
            className="h-12 w-12 rounded-xl"
          />
        );
    }
  };

  const getNotificationDecs = (type: string, notification: any) => {
    switch (type) {
      case "like":
        return (
          getUser(notification.fromUserId || 0)?.name +
          " " +
          getUser(notification.fromUserId || 0)?.surname +
          " оценил(-а) ваш профиль"
        );
      case "subscribe":
        return (
          getUser(notification.fromUserId || 0)?.name +
          " " +
          getUser(notification.fromUserId || 0)?.surname +
          " подписался(-ась) на вас"
        );
      case "friend request":
        return (
          getUser(notification.fromUserId || 0)?.name +
          " " +
          getUser(notification.fromUserId || 0)?.surname +
          " отправил(-а) вам запрос"
        );
      case "meet request":
        return (
          getUser(notification.fromUserId || 0)?.name +
          " " +
          getUser(notification.fromUserId || 0)?.surname +
          " отправил(-а) вам запрос"
        );
      case "meet invite":
        return (
          getUser(notification.fromUserId || 0)?.name +
          " " +
          getUser(notification.fromUserId || 0)?.surname +
          " пригласил(-а) вас на встречу"
        );
    }
  };

  const handleNavigate = (type: string, notification: any) => {
    switch (type) {
      case "meet invite":
        navigate({ to: "/my-meetings" });
        break;
      case "meet request":
        navigate({ to: "/my-meetings" });
        break;
      case "friend request":
        navigate({ to: "/profile" });
        break;
      case "like":
        navigate({ to: "/profile" });
        break;
      case "subscribe":
        navigate({ to: "/profile" });
        break;
    }
  };

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-14 pb-10 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">Уведомления</h1>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>
      <div className="flex w-full flex-col items-start justify-center gap-4 px-4">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              className="flex w-full cursor-pointer items-center justify-between"
              onClick={() => {
                handleNavigate(notification.type || "", notification);
                readNotification.mutate({ id: notification.id });
              }}
            >
              <div className="flex flex-col items-start justify-between gap-2">
                <div>{getNotificationMessage(notification.type || "")}</div>
                <div className="text-xs text-neutral-500">
                  {getNotificationDecs(notification.type || "", notification)}
                </div>
              </div>
              <div className="flex items-start justify-center gap-2">
                <div>
                  {notification.createdAt
                    ? dayjs(notification.createdAt).format("HH:mm")
                    : ""}
                </div>
                {getNotificationIcon(notification.type || "", notification)}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-start text-sm text-gray-500">
            Уведомлений пока нет
          </div>
        )}
      </div>
    </div>
  );
}
