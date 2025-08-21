import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Tag, X } from "lucide-react";
import { Drawer } from "vaul";
import { FastMeet, User as UserType } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";
import { useTRPC } from "~/trpc/init/react";
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
  const trpc = useTRPC();

  // Fetch all users to get organizer information
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

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

  // Get user photo with fallback
  const getUserPhoto = (userId: number | null) => {
    if (!userId) return "/men.jpeg";
    const user = users?.find((u) => u.id === userId);
    if (!user) return "/men.jpeg";
    return getImage(user, user.photo || "");
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[55vh] flex-col rounded-t-[20px] bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Встречи в этом месте</h2>
                <p className="text-sm text-gray-500">
                  {meetings.length}{" "}
                  {meetings.length === 1
                    ? "встреча"
                    : meetings.length < 5
                      ? "встречи"
                      : "встреч"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:scale-105 hover:bg-gray-200 active:scale-95"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="scrollbar-hidden flex-1 overflow-y-auto px-4 pb-24">
            <div className="space-y-4">
              {meetings.map((meeting, index) => {
                const eventTypeInfo = meeting.type
                  ? getEventTypeInfo(meeting.type)
                  : null;
                const isUsersMeet = meeting.userId === currentUser?.id;
                const organizer = users?.find((u) => u.id === meeting.userId);
                const organizerName = organizer
                  ? `${organizer.name || ""} ${organizer.surname || ""}`.trim()
                  : `ID: ${meeting.userId}`;

                return (
                  <div
                    key={meeting.id}
                    onClick={() => onMeetingSelect(meeting)}
                    className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100 active:scale-[0.98]"
                  >
                    {/* Header with Organizer Info */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={getUserPhoto(meeting.userId)}
                            alt={organizerName}
                            className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-white"
                          />
                          {isUsersMeet && (
                            <div className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-green-500"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-purple-700">
                            {meeting.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isUsersMeet ? "Вы" : organizerName}
                          </p>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(meeting.createdAt)}</span>
                      </div>
                    </div>

                    {/* Description */}

                    {/* Event Type and Tags Row */}
                    <div className="mb-4 flex items-center gap-3">
                      {/* Event Type */}
                      {(meeting.type || meeting.subType) && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              eventTypeInfo?.bgColor
                                ?.replace("bg-", "bg-")
                                .replace("-100", "-200") || "bg-gray-100"
                            }`}
                          >
                            {eventTypeInfo?.emoji ? (
                              <span className="text-sm">{eventTypeInfo.emoji}</span>
                            ) : (
                              <Tag className="h-3 w-3 text-gray-600" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-gray-700">
                            {meeting.subType || meeting.type}
                          </span>
                        </div>
                      )}

                      {/* Tags */}
                      {meeting.tags && meeting.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {meeting.tags.slice(0, 2).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {meeting.tags.length > 2 && (
                            <span className="text-xs font-medium text-gray-500">
                              +{meeting.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Location Info */}
                    {meeting.locations && meeting.locations.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{meeting.locations[0].location}</span>
                      </div>
                    )}

                    {/* User's Meet Badge */}
                    {isUsersMeet && (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <span>Ваша встреча</span>
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
