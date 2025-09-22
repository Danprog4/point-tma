import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/notif")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("notif");
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const markNotificationsAsRead = useMutation(
    trpc.main.markNotificationsAsRead.mutationOptions(),
  );
  const { data: notifications } = useQuery(trpc.main.getNotifications.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const readNotification = useMutation(trpc.main.readNotification.mutationOptions());
  const { data: meetings } = useQuery(trpc.meetings.getMeetings.queryOptions());

  useEffect(() => {
    markNotificationsAsRead.mutate();
    queryClient.setQueryData(trpc.main.getNotifications.queryKey(), (old: any) => {
      return old.map((n: any) => (n.isRead === false ? { ...n, isRead: true } : n));
    });
  }, []);

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
    const iconContent = (() => {
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
              src={getImageUrl(getUser(notification.fromUserId || 0)?.photo || "")}
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
    })();

    return <div className="relative">{iconContent}</div>;
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
        navigate({ to: "/meet/$id", params: { id: notification.meetId.toString() } });
        saveScrollPosition("notif");
        break;
      case "meet request":
        navigate({ to: "/meet/$id", params: { id: notification.meetId.toString() } });
        saveScrollPosition("notif");
        break;
      case "friend request":
        navigate({ to: "/profile" });
        saveScrollPosition("notif");
        break;
      case "like":
        navigate({ to: "/profile" });
        saveScrollPosition("notif");
        break;
      case "subscribe":
        navigate({ to: "/profile" });
        saveScrollPosition("notif");
        break;
    }
  };

  // Приоритет сортировки по типу уведомления
  const typePriority: Record<string, number> = {
    "meet invite": 1,
    "meet request": 2,
    "friend request": 3,
    subscribe: 4,
    like: 5,
  };

  const sortByTypePriority = (arr: any[]) =>
    [...arr].sort(
      (a, b) => (typePriority[a.type || ""] ?? 99) - (typePriority[b.type || ""] ?? 99),
    );

  // Группировка как в истории: Сегодня, Вчера, За 30 дней (остальное игнорируем)
  const groupNotificationsByTime = () => {
    if (!notifications) return { today: [], yesterday: [], last30Days: [] };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOf30DaysAgo = new Date(startOfToday);
    startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);

    const toDate = (d?: string | Date | null) => (d ? new Date(d) : new Date(0));

    const today = notifications.filter((n) => {
      const d = toDate(n.createdAt as any);
      return d >= startOfToday;
    });
    const yesterday = notifications.filter((n) => {
      const d = toDate(n.createdAt as any);
      return d >= startOfYesterday && d < startOfToday;
    });
    // Включаем сюда не только последние 30 дней, но и всё, что старше вчера
    const last30Days = notifications.filter((n) => {
      const d = toDate(n.createdAt as any);
      return d < startOfYesterday;
    });

    return {
      today: sortByTypePriority(today),
      yesterday: sortByTypePriority(yesterday),
      last30Days: sortByTypePriority(last30Days),
    };
  };

  const handleReadNotification = (notification: any) => {
    readNotification.mutate({ id: notification.id });
    queryClient.setQueryData(trpc.main.getNotifications.queryKey(), (old: any) => {
      return old.map((n: any) => (n.id === notification.id ? { ...n, isRead: true } : n));
    });
  };

  const renderNotificationItem = (notification: any) => (
    <div
      key={notification.id}
      className="flex w-full cursor-pointer items-center justify-between border-b border-gray-100 py-3"
      onClick={() => {
        handleNavigate(notification.type || "", notification);
        handleReadNotification(notification);
      }}
    >
      <div className="flex flex-col items-start justify-between gap-2">
        <div className="text-sm font-medium text-gray-800">
          {getNotificationMessage(notification.type || "")}
        </div>
        <div className="text-xs text-neutral-500">
          {getNotificationDecs(notification.type || "", notification)}
        </div>
      </div>
      <div className="flex items-start justify-center gap-2">
        <div className="text-xs text-gray-500">
          {notification.createdAt ? dayjs(notification.createdAt).format("HH:mm") : ""}
        </div>
        {getNotificationIcon(notification.type || "", notification)}
      </div>
    </div>
  );

  const renderNotificationSection = (
    title: string,
    notifications: any[],
    showDate: boolean = false,
  ) => {
    if (notifications.length === 0) return null;

    return (
      <div className="w-full">
        <div className="font-semibold text-black">{title}</div>
        <div className="w-full">{notifications.map(renderNotificationItem)}</div>
      </div>
    );
  };

  const isMobile = usePlatform();
  const groupedNotifications = groupNotificationsByTime();

  console.log(groupedNotifications);
  console.log(notifications);

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
        <div className="flex h-5 w-5 items-center justify-center"></div>
      </div>

      <div className="flex w-full flex-col items-start justify-center gap-6 px-4">
        {notifications && notifications.length > 0 ? (
          <>
            {renderNotificationSection("Сегодня", groupedNotifications.today)}
            {renderNotificationSection("Вчера", groupedNotifications.yesterday)}
            {renderNotificationSection("За 30 дней", groupedNotifications.last30Days)}
          </>
        ) : (
          <div className="px-4 py-4 text-start text-sm text-gray-500">
            Уведомлений пока нет
          </div>
        )}
      </div>
    </div>
  );
}
