import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { Coin } from "~/components/Icons/Coin";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { Quest } from "~/types/quest";

export function SeriesQuestCard({ quest }: { quest: Quest }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative mx-4 mb-8"
    >
      {/* Decorative stacked layers for "series" look */}
      <div className="absolute -right-1 -bottom-2 left-3 -z-10 h-10 rounded-2xl bg-red-200/40 blur-[1px]" />
      <div className="absolute -right-2 -bottom-4 left-6 -z-20 h-10 rounded-2xl bg-red-300/20 blur-[2px]" />

      <div
        className="group relative cursor-pointer overflow-hidden rounded-3xl bg-white p-[2px] shadow-xl transition-all hover:shadow-red-100/50"
        onClick={() => {
          if (quest && quest.id !== undefined && quest.id !== null) {
            saveScrollPosition("quests");
            navigate({
              to: "/event/$name/$id",
              params: { name: "Квест", id: quest.id.toString() },
            });
          }
        }}
      >
        {/* Animated Gradient Border Perimeter */}
        <div className="animate-gradient-xy absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

        <div className="relative flex flex-col rounded-[22px] bg-white p-5">
          {/* Halloween Badge */}

          <div className="flex gap-4">
            <div className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
              <img
                src={quest.image}
                alt={quest.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-red-900/10 to-transparent" />
            </div>

            <div className="flex flex-1 flex-col justify-center space-y-2.5">
              <h3 className="line-clamp-2 pr-16 text-lg leading-tight font-black text-gray-900">
                {quest.title}
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold tracking-tight text-red-700 uppercase ring-1 ring-red-200">
                  Серия квестов
                </span>
                <span className="inline-flex items-center rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold tracking-tight text-orange-700 uppercase ring-1 ring-orange-200">
                  Хэллоуин
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Clock className="h-4 w-4 text-red-500/70" />
                  <span className="text-xs font-semibold">{quest.date || "Сейчас"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="h-4 w-4 text-red-500/70" />
                  <span className="text-xs font-semibold">
                    {quest.location || "Локация"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-gray-600 italic opacity-80">
            {quest.description}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              {quest.hasAchievement && (
                <div className="animate-bounce-subtle flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg shadow-inner ring-1 ring-amber-200">
                  🏆
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Награда
                </span>
                <span className="text-xs font-bold text-red-600/80">Exclusive Drop</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl bg-gray-900 px-5 py-2.5 text-white shadow-xl transition-all group-hover:scale-105 group-hover:bg-red-600">
              <span className="text-base font-black">
                +
                {(
                  quest.rewards?.find((r) => r.type === "point")?.value ?? 0
                ).toLocaleString()}
              </span>
              <Coin />
            </div>
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s linear infinite;
        }
      `,
        }}
      />
    </motion.div>
  );
}
