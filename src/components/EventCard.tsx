export const EventCard = ({ event }: { event: any }) => {
  console.log(event);
  return (
    <div className="w-45 flex-shrink-0 overflow-hidden">
      <div className={`h-32 ${event.bg || ""} relative`}>
        {event.image && (
          <img
            src={event.image}
            alt={event.title}
            className="absolute inset-0 h-full w-full rounded-2xl bg-transparent object-cover"
          />
        )}
        <div className="absolute bottom-2 left-2 z-10 flex gap-1">
          {event.category && (
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
              {event.category}
            </span>
          )}
          {event.price && (
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
              {event.price}
            </span>
          )}
        </div>
      </div>
      <div className="pt-2 text-sm">
        <h3 className="mb-1 font-medium text-gray-900">
          {event.title && event.title.length > 10
            ? event.title.slice(0, 20) + "..."
            : event.title}
        </h3>
        {event.description && (
          <p className="text-sm text-[#ABABAB]">
            {event.description.slice(0, 20) + "..."}
          </p>
        )}
      </div>
    </div>
  );
};
