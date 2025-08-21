import { ArrowLeft, Calendar, MapPin, Tag, User, X } from "lucide-react";
import { Drawer } from "vaul";
import { FastMeet, User as UserType } from "~/db/schema";
import { eventTypes } from "~/types/events";

interface FastMeetsListDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetings: FastMeet[];
  currentUser: UserType | null;
  onMeetingSelect: (meeting: FastMeet) => void;
}

export default function FastMeetsListDrawer({
  open,
  onOpenChange,
  meetings,
  currentUser,
  onMeetingSelect,
}: FastMeetsListDrawerProps) {
  if (!open || meetings.length === 0) {
    return null;
  }

  // Format date for display
  const formatDate = (date: Date | string | null) => {
    if (!date) return "Не указано";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get event type information
  const getEventTypeInfo = (typeName: string) => {
    return eventTypes.find((type) => type.name === typeName);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[85vh] flex-col rounded-t-[20px] bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-lg font-bold text-gray-900">
              Встречи в этом месте ({meetings.length})
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="scrollbar-hidden flex-1 overflow-y-auto px-4 pb-24">
            <div className="space-y-4">
              {meetings.map((meeting, index) => {
                const eventTypeInfo = meeting.type ? getEventTypeInfo(meeting.type) : null;
                const isUsersMeet = meeting.userId === currentUser?.id;

                return (
                  <div
                    key={meeting.id}
                    onClick={() => onMeetingSelect(meeting)}
                    className="cursor-pointer rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 active:scale-95"
                  >
                    {/* Title and Description */}
                    <div className="mb-3">
                      <h3 className="mb-1 text-lg font-semibold text-gray-900">
                        {meeting.name}
                      </h3>
                      {meeting.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                    </div>

                    {/* Quick Info Row */}
                    <div className="flex items-center justify-between">
                      {/* Author */}
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-600">
                          {isUsersMeet ? "Вы" : `ID: ${meeting.userId}`}
                        </span>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatDate(meeting.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Event Type */}
                    {(meeting.type || meeting.subType) && (
                      <div className="mt-3 flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full ${
                            eventTypeInfo?.bgColor
                              ?.replace("bg-", "bg-")
                              .replace("-100", "-200") || "bg-gray-200"
                          }`}
                        >
                          {eventTypeInfo?.emoji ? (
                            <span className="text-xs">{eventTypeInfo.emoji}</span>
                          ) : (
                            <Tag className="h-3 w-3 text-gray-600" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600">
                          {meeting.subType || meeting.type}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {meeting.tags && meeting.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {meeting.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {meeting.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{meeting.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Location Info */}
                    {meeting.locations && meeting.locations.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {meeting.locations[0].location}
                        </span>
                      </div>
                    )}

                    {/* User's Meet Indicator */}
                    {isUsersMeet && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-green-600 font-medium">
                          Ваша встреча
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
