import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { Coin } from "~/components/Icons/Coin";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { Quest } from "~/types/quest";
import { motion } from "framer-motion";

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
      <div className="absolute -bottom-2 -right-1 left-3 h-10 rounded-2xl bg-red-200/40 -z-10 blur-[1px]" />
      <div className="absolute -bottom-4 -right-2 left-6 h-10 rounded-2xl bg-red-300/20 -z-20 blur-[2px]" />

      <div
        className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-red-100 bg-white p-5 shadow-xl transition-all hover:border-red-300 hover:shadow-red-100/50"
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
        {/* Highlight Gradient Top Line */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />
        
        {/* Halloween Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[10px] font-black text-white shadow-lg ring-2 ring-white uppercase tracking-wider">
            <span className="animate-pulse">🎃</span> Special
          </span>
        </div>

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
            <h3 className="pr-16 text-lg leading-tight font-black text-gray-900 line-clamp-2">
              {quest.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 ring-1 ring-red-200 uppercase tracking-tight">
                Серия квестов
              </span>
              <span className="inline-flex items-center rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200 uppercase tracking-tight">
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
                <span className="text-xs font-semibold">{quest.location || "Локация"}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-600 line-clamp-2 italic opacity-80">
          {quest.description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="flex items-center gap-3">
            {quest.hasAchievement && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-lg shadow-inner ring-1 ring-amber-200 animate-bounce-subtle">
                🏆
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Награда
              </span>
              <span className="text-xs font-bold text-red-600/80">Exclusive Drop</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 rounded-2xl bg-gray-900 px-5 py-2.5 text-white shadow-xl transition-all group-hover:scale-105 group-hover:bg-red-600">
            <span className="text-base font-black">
              +{(quest.rewards?.find((r) => r.type === "point")?.value ?? 0).toLocaleString()}
            </span>
            <Coin />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </motion.div>
  );
}
