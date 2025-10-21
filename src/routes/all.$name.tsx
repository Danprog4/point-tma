import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { Selecter } from "~/components/Selecter";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { getPluralCategoryName } from "~/lib/utils/getPluralCategoryName";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/all/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("all");
  const trpc = useTRPC();
  const { name } = Route.useParams();
  const [selectedFilter, setSelectedFilter] = useState(name);
  const navigate = useNavigate();
  console.log(name);
  const { data: eventsData } = useQuery(trpc.event.getEvents.queryOptions());
  const { data: popularEvents } = useQuery(trpc.main.getPopularEvents.queryOptions());
  const { data: newEvents } = useQuery(trpc.event.getNewEvents.queryOptions());

  let data: any[] = [];
  switch (name) {
    case "Популярное":
      data = popularEvents || [];
      break;
    case "Новое":
      data = newEvents || [];
      break;
    case "Квесты":
      data = eventsData?.filter((event) => event.category === "Квест") || [];
      console.log(data);
      break;
    case "Кино":
      data = eventsData?.filter((event) => event.category === "Кино") || [];
      break;
    case "Конференции":
      data = eventsData?.filter((event) => event.category === "Конференция") || [];
      break;
    case "Вечеринки":
      data = eventsData?.filter((event) => event.category === "Вечеринка") || [];
      break;
    case "Нетворкинг":
      data = eventsData?.filter((event) => event.category === "Нетворкинг") || [];
      break;
    default:
      data = [];
  }

  const typeOrCategory = name === "Популярное" || name === "Новое" ? "category" : "type";
  const pluralCategoryName = getPluralCategoryName(name);

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="flex flex-col overflow-y-auto pt-10 pb-10 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 left-0 z-10 flex w-full items-center justify-between bg-white/95 p-4 backdrop-blur-sm data-[mobile=true]:pt-28"
      >
        <motion.button
          onClick={() => navigate({ to: "/" })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 active:scale-95"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </motion.button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900">
          {name}
        </h1>
        {/* Empty div to balance the right side */}
        <div className="flex h-9 w-9" />
      </div>
      <div className="flex items-center gap-3 p-4 pb-6">
        <div className="flex items-center gap-2">
          <Selecter height="h-10" width="w-full" placeholder="Москва" />
        </div>
        <div className="scrollbar-hidden flex flex-nowrap gap-2 overflow-x-auto">
          {[
            { emoji: "🎉", name: "Популярное" },
            { emoji: "🆕", name: "Новое" },
            { emoji: "🎞", name: "Кино" },
            { emoji: "💃", name: "Вечеринки" },
            { emoji: "📈", name: "Конференции" },
            { emoji: "🤝", name: "Нетворкинг" },
            { emoji: "🕵️‍♂️", name: "Квесты" },
          ].map((chip) => (
            <motion.div
              onClick={() => {
                navigate({ to: "/all/$name", params: { name: chip.name } });
                setSelectedFilter(chip.name);
              }}
              key={chip.name}
              className={`flex cursor-pointer flex-row flex-nowrap items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-nowrap shadow-sm transition-all ${
                selectedFilter === chip.name
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>{chip.emoji}</span>
              <span>{chip.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mb-6 px-4">
        {data.slice(0, 1).map((item) => {
          return (
            <motion.div
              key={item.id || item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="group overflow-hidden rounded-3xl shadow-xl"
              onClick={() => {
                saveScrollPosition("all");
                navigate({
                  to: "/event/$name/$id",
                  params: { name: item.category!, id: item.id!.toString()! },
                });
              }}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={
                    item.image?.startsWith("https://") || item.image?.startsWith("/")
                      ? item.image
                      : getImageUrl(item.image || "")
                  }
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-6">
                  <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      {item.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                      {item.date && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{item.date}</span>
                        </div>
                      )}
                      {item.location && (
                        <>
                          <span className="text-white/50">•</span>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>{item.location}</span>
                          </div>
                        </>
                      )}
                      {item.price && (
                        <>
                          <span className="text-white/50">•</span>
                          <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white">
                            {item.price}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-col">
        <Calendar />
        <div className="mx-auto mb-4 flex max-w-[145px] items-center justify-center">
          <Selecter
            height="h-8"
            width="w-full"
            placeholder="Все события"
            cities={[
              "Все события",
              "Популярное",
              "Новое",
              "Кино",
              "Театр",
              "Концерты",
              "Конференции",
              "Вечеринки",
            ]}
          />
        </div>
      </div>

      {Object.entries(
        data.reduce(
          (acc, item) => {
            if (!acc[item[typeOrCategory]]) acc[item[typeOrCategory]] = [];
            acc[item[typeOrCategory]].push(item);
            return acc;
          },
          {} as Record<string, typeof data>,
        ),
      ).map(([type, items]) => (
        <div key={type} className="mb-8">
          <h2 className="mb-4 px-4 text-xl font-bold text-gray-900">
            {getPluralCategoryName(type)}
          </h2>

          <div className="grid grid-cols-2 gap-3 px-4">
            {(items as any[]).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  saveScrollPosition("all");
                  navigate({
                    to: "/event/$name/$id",
                    params: { name: item.category!, id: item.id!.toString()! },
                  });
                }}
                className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <img
                    src={
                      item.image?.startsWith("https://") || item.image?.startsWith("/")
                        ? item.image
                        : getImageUrl(item.image || "")
                    }
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
                    {item.date && (
                      <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md backdrop-blur-sm">
                        {item.date}
                      </span>
                    )}
                    {item.price && (
                      <span className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                        {item.price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 line-clamp-2 leading-tight font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="line-clamp-2 text-xs text-gray-500">
                      {item.description}
                    </p>
                  )}
                  {item.location && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
