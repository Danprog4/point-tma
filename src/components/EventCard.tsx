import { getImageUrl } from "~/lib/utils/getImageURL";

export const EventCard = ({ event }: { event: any }) => {
  return (
    <div className="group w-45 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl">
      <div className={`relative h-32 overflow-hidden ${event.bg || ""}`}>
        {event.image && (
          <>
            <img
              src={
                event.image?.startsWith("https://") || event.image?.startsWith("/")
                  ? event.image
                  : getImageUrl(event.image)
              }
              alt={event.title}
              className="h-full w-full rounded-t-2xl object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </>
        )}
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {event.category && (
            <span className="rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-gray-900 shadow-md backdrop-blur-sm">
              {event.category}
            </span>
          )}
          {event.price && (
            <span className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
              {event.price}
            </span>
          )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="mb-1 leading-tight font-semibold text-gray-900">
          {event.title && event.title.length > 10
            ? event.title.slice(0, 20) + "..."
            : event.title}
        </h3>
        {event.description && (
          <p className="line-clamp-2 text-xs text-gray-500">
            {event.description.slice(0, 40) + "..."}
          </p>
        )}
      </div>
    </div>
  );
};
