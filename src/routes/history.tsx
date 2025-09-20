import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-42"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">История</h1>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>

      {/* Filter Chips */}
      <div className="scrollbar-hidden overflow-x-auto px-4 pb-4">
        <div className="flex gap-4">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 rounded-[20px] px-4 py-2.5 text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      {(!groups || groups.length === 0) && (
        <div className="px-4 text-gray-500">Ваша история пока пуста</div>
      )}
      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.key} className="pb-4">
            <div className="px-4 pt-2 pb-2 text-xs font-semibold text-gray-500 uppercase">
              {group.title}
            </div>
            <div className="divide-y divide-gray-100">
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
                  <button
                    key={log.id}
                    onClick={() => {
                      if (log.route) navigate({ to: log.route as any });
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-50"
                  >
                    {log.entityImage ? (
                      <img
                        src={
                          log.entityImage.startsWith("/")
                            ? log.entityImage
                            : getImageUrl(log.entityImage)
                        }
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-900">
                        {Icon}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900">{label}</div>
                      {log.entityTitle && (
                        <div className="text-xs text-gray-700">{log.entityTitle}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        {log.meetId
                          ? `Встреча #${log.meetId}`
                          : log.caseId
                            ? `Кейс #${log.caseId}`
                            : log.itemId && log.type?.startsWith("friend_")
                              ? `Профиль #${log.itemId}`
                              : ""}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-900">
                      {group.key === "30days" ? dateWithTime : time}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
