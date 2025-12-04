import { Calendar, MapPin } from "lucide-react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { Coin } from "./Icons/Coin";

export const EventCard = ({ event }: { event: any }) => {
  return (
    <div className="group w-[200px] flex-shrink-0 overflow-hidden rounded-[24px] bg-white transition-all duration-300 hover:-translate-y-1">
      <div
        className={`relative h-[160px] overflow-hidden rounded-[24px] ${event.bg || "bg-gray-100"}`}
      >
        {event.image && (
          <>
            <img
              src={
                event.image?.startsWith("https://") || event.image?.startsWith("/")
                  ? event.image
                  : getImageUrl(event.image)
              }
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
          </>
        )}
        <div className="absolute top-3 left-3">
          {event.category && (
            <span className="inline-block rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              {event.category}
            </span>
          )}
        </div>
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between">
          {event.price > 0 ? (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-black shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-center gap-[-2px]">
                <span>{event.price}</span> <Coin />
              </div>
            </span>
          ) : (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-black shadow-sm backdrop-blur-sm">
              Бесплатно
            </span>
          )}
        </div>
      </div>
      <div className="px-1 pt-3 pb-2">
        <h3 className="mb-1.5 line-clamp-2 h-[40px] text-[15px] leading-[20px] font-bold text-gray-900 transition-colors group-hover:text-purple-600">
          {event.title}
        </h3>
        <div className="flex flex-col gap-1.5">
          {event.date && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{event.date}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          {!event.date && !event.location && event.description && (
            <p className="line-clamp-2 h-8 text-xs text-gray-500">{event.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
