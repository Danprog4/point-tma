import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Check,
  Heart,
  Lock,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { toast } from "sonner";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils/cn";
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
  const [activeFilter, setActiveFilter] = useState("Все");

  const markNotificationsAsRead = useMutation(
    trpc.notifications.markNotificationsAsRead.mutationOptions(),
  );
  const { data: notifications } = useQuery(
    trpc.notifications.getNotifications.queryOptions(),
  );

  // Filter logic
  const filters = [
    { name: "Все", value: "Все" },
    { name: "Встречи", value: "meet" },
    { name: "Друзья", value: "friend" },
    { name: "Лайки", value: "like" },
  ];

  const filteredNotifications = notifications?.filter((n) => {
    if (activeFilter === "Все") return true;
    if (activeFilter === "meet")
      return n.type === "meet invite" || n.type === "meet request";
    if (activeFilter === "friend")
      return (
        n.type === "friend request" ||
        n.type === "subscribe" ||
        n.type?.startsWith("private_request")
      );
    if (activeFilter === "like") return n.type === "like";
    return true;
  });

  // Extract unique user IDs and meeting IDs from filtered notifications (only what we'll render)
  const { userIds, meetingIds } = useMemo(() => {
    if (!filteredNotifications) return { userIds: [], meetingIds: [] };

    const uniqueUserIds = new Set<number>();
    const uniqueMeetingIds = new Set<number>();

    filteredNotifications.forEach((n) => {
      if (n.fromUserId) uniqueUserIds.add(n.fromUserId);
      if (n.meetId) uniqueMeetingIds.add(n.meetId);
    });

    return {
      userIds: Array.from(uniqueUserIds),
      meetingIds: Array.from(uniqueMeetingIds),
    };
  }, [filteredNotifications]);

  const { data: users } = useQuery({
    ...trpc.main.getUsersByIds.queryOptions({ ids: userIds }),
    enabled: userIds.length > 0,
  });
  const readNotification = useMutation(trpc.main.readNotification.mutationOptions());
  const { data: meetings } = useQuery({
    ...trpc.meetings.getMeetingsByIds.queryOptions({ ids: meetingIds }),
    enabled: meetingIds.length > 0,
  });

  const acceptPrivateRequest = useMutation(
    trpc.privateProfile.acceptRequest.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getNotifications.queryKey(),
        });
        toast.success("Запрос принят");
      },
      onError: () => {
        toast.error("Ошибка при принятии запроса");
      },
    }),
  );

  const rejectPrivateRequest = useMutation(
    trpc.privateProfile.rejectRequest.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getNotifications.queryKey(),
        });
        toast.success("Запрос отклонен");
      },
      onError: () => {
        toast.error("Ошибка при отклонении запроса");
      },
    }),
  );

  useEffect(() => {
    markNotificationsAsRead.mutate();
    queryClient.setQueryData(
      trpc.notifications.getNotifications.queryKey(),
      (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((n: any) => (n.isRead === false ? { ...n, isRead: true } : n));
      },
    );
  }, []);

  const getUser = (userId: number) => {
    return users?.find((user) => user.id === userId);
  };

  const getMeeting = (meetId: number) => {
    return meetings?.find((meet) => meet.id === meetId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
            <Heart className="h-4 w-4 fill-current" />
          </div>
        );
      case "subscribe":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
            <UserPlus className="h-4 w-4" />
          </div>
        );
      case "friend request":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-500">
            <Users className="h-4 w-4" />
          </div>
        );
      case "meet request":
      case "meet invite":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <Calendar className="h-4 w-4" />
          </div>
        );
      case "private_request":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Lock className="h-4 w-4" />
          </div>
        );
      case "private_request_accepted":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check className="h-4 w-4" />
          </div>
        );
      case "private_request_rejected":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
            <X className="h-4 w-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const getNotificationDecs = (type: string, notification: any) => {
    const user = getUser(notification.fromUserId || 0);
    const userName = user ? `${user.name} ${user.surname}` : "Пользователь";

    switch (type) {
      case "like":
        return <span className="font-medium">{userName} оценил(-а) ваш профиль</span>;
      case "subscribe":
        return <span className="font-medium">{userName} подписался(-ась) на вас</span>;
      case "friend request":
        return <span className="font-medium">{userName} отправил(-а) вам запрос</span>;
      case "meet request":
        return (
          <span className="font-medium">{userName} хочет присоединиться к встрече</span>
        );
      case "meet invite":
        return (
          <span className="font-medium">{userName} пригласил(-а) вас на встречу</span>
        );
      case "private_request":
        return (
          <span className="font-medium">
            {userName} хочет подписаться на ваш закрытый профиль
          </span>
        );
      case "private_request_accepted":
        return (
          <span className="font-medium">
            {userName} принял(-а) ваш запрос на подписку
          </span>
        );
      case "private_request_rejected":
        return (
          <span className="font-medium">
            {userName} отклонил(-а) ваш запрос на подписку
          </span>
        );
      default:
        return null;
    }
  };

  const handleNavigate = (type: string, notification: any) => {
    // Prevent navigation for action clicks handled elsewhere
    if (type === "private_request") return;

    switch (type) {
      case "meet invite":
      case "meet request":
        navigate({ to: "/meet/$id", params: { id: notification.meetId.toString() } });
        break;
      case "friend request":
      case "like":
      case "subscribe":
      case "private_request_accepted":
        navigate({
          to: "/user-profile/$id",
          params: { id: notification.fromUserId.toString() },
        });
        break;
    }
    saveScrollPosition("notif");
  };

  // Приоритет сортировки по типу уведомления
  const typePriority: Record<string, number> = {
    private_request: 0,
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
    if (!filteredNotifications) return { today: [], yesterday: [], last30Days: [] };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const toDate = (d?: string | Date | null) => (d ? new Date(d) : new Date(0));

    const today = filteredNotifications.filter((n) => {
      const d = toDate(n.createdAt as any);
      return d >= startOfToday;
    });
    const yesterday = filteredNotifications.filter((n) => {
      const d = toDate(n.createdAt as any);
      return d >= startOfYesterday && d < startOfToday;
    });
    const last30Days = filteredNotifications.filter((n) => {
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
    if (notification.isRead) return;
    readNotification.mutate({ id: notification.id });
    queryClient.setQueryData(
      trpc.notifications.getNotifications.queryKey(),
      (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((n: any) =>
          n.id === notification.id ? { ...n, isRead: true } : n,
        );
      },
    );
  };

  const renderNotificationItem = (notification: any) => {
    const user = getUser(notification.fromUserId || 0);
    const meeting = notification.meetId ? getMeeting(notification.meetId) : null;
    const mainImage = meeting?.image || user?.photo || user?.photoUrl;

    return (
      <div
        key={notification.id}
        className={cn(
          "group relative mb-3 flex flex-col gap-3 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all active:scale-[0.99]",
          !notification.isRead && "bg-violet-50/50 ring-violet-100",
        )}
        onClick={() => {
          handleNavigate(notification.type || "", notification);
          handleReadNotification(notification);
        }}
      >
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={getImageUrl(mainImage || "")}
              alt=""
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="absolute -right-1 -bottom-1 rounded-full bg-white p-0.5 shadow-sm">
              {getNotificationIcon(notification.type || "")}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm text-gray-900">
                {getNotificationDecs(notification.type || "", notification)}
              </span>
              <span className="text-[10px] font-medium whitespace-nowrap text-gray-400">
                {notification.createdAt
                  ? dayjs(notification.createdAt).format("HH:mm")
                  : ""}
              </span>
            </div>

            {meeting && (
              <div className="mt-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                <span className="font-medium text-gray-900">{meeting.name}</span>
                {meeting.description && (
                  <span className="block truncate opacity-70">{meeting.description}</span>
                )}
              </div>
            )}
          </div>

          {!notification.isRead && (
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <div className="h-2 w-2 rounded-full bg-violet-500" />
            </div>
          )}
        </div>

        {notification.type === "private_request" && (
          <div className="flex w-full gap-2 pl-[60px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const queryKey = trpc.notifications.getNotifications.queryKey();
                const previousNotifications = queryClient.getQueryData(queryKey);

                // Optimistic update: remove the notification immediately
                queryClient.setQueryData(queryKey, (old: any) => {
                  if (!old || !Array.isArray(old)) return old;
                  return old.filter((n: any) => n.id !== notification.id);
                });

                acceptPrivateRequest.mutate(
                  { requesterId: notification.fromUserId },
                  {
                    onError: () => {
                      // Revert on error
                      if (previousNotifications) {
                        queryClient.setQueryData(queryKey, previousNotifications);
                      }
                    },
                  },
                );
              }}
              disabled={acceptPrivateRequest.isPending || rejectPrivateRequest.isPending}
              className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-bold text-white transition-transform active:scale-95"
            >
              Принять
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const queryKey = trpc.notifications.getNotifications.queryKey();
                const previousNotifications = queryClient.getQueryData(queryKey);

                // Optimistic update: remove the notification immediately
                queryClient.setQueryData(queryKey, (old: any) => {
                  if (!old || !Array.isArray(old)) return old;
                  return old.filter((n: any) => n.id !== notification.id);
                });

                rejectPrivateRequest.mutate(
                  { requesterId: notification.fromUserId },
                  {
                    onError: () => {
                      // Revert on error
                      if (previousNotifications) {
                        queryClient.setQueryData(queryKey, previousNotifications);
                      }
                    },
                  },
                );
              }}
              disabled={acceptPrivateRequest.isPending || rejectPrivateRequest.isPending}
              className="flex-1 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-900 transition-transform active:scale-95"
            >
              Отклонить
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderNotificationSection = (title: string, notifications: any[]) => {
    if (notifications.length === 0) return null;

    return (
      <div className="w-full">
        <div className="mb-3 px-1 text-sm font-bold tracking-wider text-gray-500 uppercase">
          {title}
        </div>
        <div className="w-full">{notifications.map(renderNotificationItem)}</div>
      </div>
    );
  };

  const isMobile = usePlatform();
  const groupedNotifications = groupNotificationsByTime();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.notifications.getNotifications.queryKey(),
    });
  };

  // Check if any mutation is loading
  const isLoading = useMemo(() => {
    return (
      acceptPrivateRequest.isPending ||
      rejectPrivateRequest.isPending ||
      markNotificationsAsRead.isPending ||
      readNotification.isPending
    );
  }, [
    acceptPrivateRequest.isPending,
    rejectPrivateRequest.isPending,
    markNotificationsAsRead.isPending,
    readNotification.isPending,
  ]);

  console.log(notifications, "notifications");
  console.log(filteredNotifications, "filteredNotifications");
  console.log({ userIds, meetingIds, activeFilter }, "debug info");

  return (
    <div
      data-mobile={isMobile}
      className="relative min-h-screen bg-[#FAFAFA] pb-10 data-[mobile=true]:pt-24"
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Обработка запроса...</p>
          </div>
        </div>
      )}
      {/* Fixed Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-95"
        >
          <ArrowLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Уведомления</h1>
        <div className="w-10" />
      </div>

      <div className="pt-20 data-[mobile=true]:pt-32">
        {/* Filters */}
        <div className="scrollbar-hidden mb-6 flex w-full gap-2 overflow-x-auto px-4 pb-2">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all active:scale-95",
                activeFilter === filter.value
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50",
              )}
            >
              {filter.name}
            </button>
          ))}
        </div>

        <PullToRefresh onRefresh={handleRefresh} className="min-h-[calc(100vh-140px)]">
          <div className="flex w-full flex-col gap-6 px-4 pb-20">
            <AnimatePresence mode="wait">
              {filteredNotifications && filteredNotifications.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key={activeFilter}
                >
                  {renderNotificationSection("Сегодня", groupedNotifications.today)}
                  {renderNotificationSection("Вчера", groupedNotifications.yesterday)}
                  {renderNotificationSection("Ранее", groupedNotifications.last30Days)}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Calendar className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Нет уведомлений</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    В этой категории пока пусто
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PullToRefresh>
      </div>
    </div>
  );
}
