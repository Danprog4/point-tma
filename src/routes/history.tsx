import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, History } from "lucide-react";
import { useMemo, useState } from "react";
import { iconByType, labelByType } from "~/config/history";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeFilter, setActiveFilter] = useState("Все");
  const filters = [
    "Все",
    "Покупки",
    "Встречи",
    "Быстрые встречи",
    "Профиль",
    "Соц",
    "Кейсы",
  ];

  const trpc = useTRPC();
  const navigate = useNavigate();
  const isMobile = usePlatform();

  const { data, isLoading } = useQuery(trpc.main.getMyLogs.queryOptions({ limit: 100 }));
  const flat = useMemo(() => data?.items ?? [], [data]);

  const filtered = useMemo(() => {
    if (!flat) return [] as typeof flat;
    switch (activeFilter) {
      case "Покупки":
        return flat.filter(
          (l) => l.type?.startsWith("event_buy") || l.type?.startsWith("case_buy"),
        );
      case "Кейсы":
        return flat.filter((l) => l.type?.startsWith("case_"));
      case "Встречи":
        return flat.filter((l) => l.type?.startsWith("meet_"));
      case "Быстрые встречи":
        return flat.filter((l) => l.type?.startsWith("fast_meet_"));
      case "Профиль":
        return flat.filter(
          (l) => l.type === "onboarding_complete" || l.type === "profile_update",
        );
      case "Соц":
        return flat.filter(
          (l) =>
            l.type?.startsWith("friend_") ||
            l.type === "favorite_add" ||
            l.type === "favorite_remove" ||
            l.type === "subscribe" ||
            l.type === "unsubscribe" ||
            l.type?.startsWith("review_") ||
            l.type?.startsWith("complaint_"),
        );
      default:
        return flat;
    }
  }, [flat, activeFilter]);

  const groups = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOf30DaysAgo = new Date(startOfToday);
    startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);

    const toDate = (d?: string | Date | null) => (d ? new Date(d) : new Date(0));

    const today = filtered.filter((l) => {
      const d = toDate(l.createdAt as any);
      return d >= startOfToday;
    });

    const yesterday = filtered.filter((l) => {
      const d = toDate(l.createdAt as any);
      return d >= startOfYesterday && d < startOfToday;
    });

    const last30Days = filtered.filter((l) => {
      const d = toDate(l.createdAt as any);
      return d >= startOf30DaysAgo && d < startOfYesterday;
    });

    return [
      { key: "today", title: "Сегодня", items: today },
      { key: "yesterday", title: "Вчера", items: yesterday },
      { key: "30days", title: "За 30 дней", items: last30Days },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-md bg-[#FAFAFA] pb-24 data-[mobile=true]:pt-24"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-[#FAFAFA]/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900" strokeWidth={2.5} />
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">История</h1>
        <div className="w-10"></div>
      </div>

      {/* Filter Chips */}
      <div className="scrollbar-hidden overflow-x-auto px-4 pt-20 pb-6 data-[mobile=true]:pt-4">
        <div className="flex gap-2.5">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
                activeFilter === filter
                  ? "bg-gray-900 text-white shadow-md shadow-gray-200"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      {(!groups || groups.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 rounded-full bg-white p-8 shadow-sm">
            <History className="h-16 w-16 text-gray-300" />
          </div>
          <div className="text-center text-gray-500">
            <p className="mb-2 text-xl font-bold text-gray-900">История пуста</p>
            <p className="text-sm text-gray-500">
              Здесь будут отображаться ваши действия
            </p>
          </div>
        </div>
      )}
      <div className="flex-1 space-y-6 px-4">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-3 px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
              {group.title}
            </div>
            <div className="flex flex-col gap-3">
              {group.items.map((log) => {
                const label = labelByType[log.type ?? ""] || log.type;
                const Icon = iconByType[log.type ?? ""];
                const created = new Date(log.createdAt ?? Date.now());
                const time = created.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateWithTime = `${created.toLocaleDateString()} ${time}`;
                return (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={log.id}
                    onClick={() => {
                      if (log.route) navigate({ to: log.route as any });
                    }}
                    className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition-transform active:scale-[0.98]"
                  >
                    {log.entityImage ? (
                      <img
                        src={
                          log.entityImage.startsWith("/")
                            ? log.entityImage
                            : getImageUrl(log.entityImage)
                        }
                        alt=""
                        className="h-12 w-12 rounded-2xl bg-gray-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-900">
                        {Icon}
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden text-left">
                      <div className="truncate text-sm font-bold text-gray-900">
                        {label}
                      </div>
                      {log.entityTitle && (
                        <div className="truncate text-xs font-medium text-gray-500">
                          {log.entityTitle}
                        </div>
                      )}
                      <div className="mt-0.5 text-[10px] font-medium text-gray-400">
                        {log.meetId
                          ? `Встреча #${log.meetId}`
                          : log.caseId
                            ? `Кейс #${log.caseId}`
                            : log.itemId && log.type?.startsWith("friend_")
                              ? `Профиль #${log.itemId}`
                              : ""}
                      </div>
                    </div>
                    <div className="pl-2 text-xs font-bold whitespace-nowrap text-gray-400">
                      {group.key === "30days" ? dateWithTime : time}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
