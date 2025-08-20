import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, LockIcon, MapPin, Tag, User, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { FastMeet, FastMeetParticipant, User as UserType } from "~/db/schema";
import { getYMaspAdress } from "~/lib/utils/getYMaspAdress";
import { useTRPC } from "~/trpc/init/react";
import { eventTypes } from "~/types/events";
import { FastMeetInfo } from "./FastMeetInfo";

export default function FastMeetDrawer({
  open,
  onOpenChange,
  meet,
  currentUser,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meet: FastMeet | null;
  currentUser: UserType | null;
}) {
  // Don't render anything if meet is null
  if (!meet) {
    return null;
  }

  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
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

  // Handle click on location to open Yandex Maps
  const handleLocationClick = (coordinates: [number, number]) => {
    const coordinatesString = `${coordinates[0]},${coordinates[1]}`;
    const mapUrl = getYMaspAdress(coordinatesString);
    window.open(mapUrl, "_blank");
  };

  // Get event type information
  const getEventTypeInfo = (typeName: string) => {
    return eventTypes.find((type) => type.name === typeName);
  };

  const eventTypeInfo = meet.type ? getEventTypeInfo(meet.type) : null;

  const isUsersMeet = meet.userId === currentUser?.id;

  const joinFastMeet = useMutation(trpc.meetings.joinFastMeet.mutationOptions());
  const acceptFastMeet = useMutation(trpc.meetings.acceptFastMeet.mutationOptions());
  const declineFastMeet = useMutation(trpc.meetings.declineFastMeet.mutationOptions());

  const { data: participants } = useQuery(
    trpc.meetings.getFastMeetParticipants.queryOptions({ meetId: meet.id }),
  );

  const { data: allParticipants } = useQuery(
    trpc.meetings.getFastMeetParticipants.queryOptions({}),
  );

  const isParticipant = participants?.some(
    (participant) =>
      participant.userId === currentUser?.id && participant.status === "pending",
  );

  const isAcceptedParticipant = participants?.some(
    (participant) =>
      participant.userId === currentUser?.id && participant.status === "accepted",
  );

  const isAlreadyParticipant = allParticipants?.some(
    (participant) =>
      participant.userId === currentUser?.id && participant.meetId !== meet.id,
  );

  const { data: fastMeets } = useQuery(trpc.meetings.getFastMeets.queryOptions());

  // Check if user owns any other fast meet
  const isAlreadyOwner = fastMeets?.some(
    (fastMeet) => fastMeet.userId === currentUser?.id && fastMeet.id !== meet.id,
  );

  // Check if user is blocked from joining (owns another meet, or is participant in another meet)
  const isBlocked = isAlreadyOwner || isAlreadyParticipant;

  const handleJoinFastMeet = () => {
    // If user owns this meet, show participants info
    if (isUsersMeet) {
      setIsMoreOpen(true);
      return;
    }

    // If user is blocked from joining, show error
    if (isBlocked) {
      if (isAlreadyOwner) {
        toast.error("У вас уже есть активная встреча");
      } else if (isAlreadyParticipant) {
        toast.error("Сначала покиньте другую встречу");
      }
      return;
    }

    // Join or leave the meet
    if (!isParticipant && !isUsersMeet) {
      joinFastMeet.mutate({ meetId: meet.id });
      queryClient.setQueryData(
        trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
        (old: FastMeetParticipant[] | undefined) => [
          ...(old || []),
          {
            id: Math.floor(Math.random() * 1000000),
            userId: currentUser?.id || null,
            status: "pending",
            meetId: meet.id,
            createdAt: new Date(),
          },
        ],
      );
    } else if (isParticipant && !isUsersMeet) {
      joinFastMeet.mutate({ meetId: meet.id });
      queryClient.setQueryData(
        trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
        (old: FastMeetParticipant[] | undefined) => [
          ...(old || []).filter((p) => p.userId !== currentUser?.id),
        ],
      );
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[85vh] flex-col rounded-t-[20px] bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-lg font-bold text-gray-900">Быстрая встреча</div>
            <button
              onClick={() => {
                onOpenChange(false);
                setIsMoreOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          {isMoreOpen ? (
            <FastMeetInfo meet={meet} currentUser={currentUser} />
          ) : (
            <>
              <div className="scrollbar-hidden flex-1 overflow-y-auto px-4 pb-24">
                {/* Title and Description */}
                <div className="mb-6">
                  <h2 className="mb-2 text-xl font-bold text-gray-900">{meet.name}</h2>
                  {meet.description && (
                    <p className="leading-relaxed text-gray-600">{meet.description}</p>
                  )}
                </div>

                {/* Info Cards */}
                <div className="space-y-4">
                  {/* Created Date */}
                  <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Создана</div>
                      <div className="text-sm text-gray-600">
                        {formatDate(meet.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Организатор</div>
                      <div className="text-sm text-gray-600">ID: {meet.userId}</div>
                    </div>
                  </div>

                  {/* Event Type */}
                  {(meet.type || meet.subType) && (
                    <div
                      className={`flex items-start gap-3 rounded-xl p-4 ${
                        eventTypeInfo?.bgColor || "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          eventTypeInfo?.bgColor
                            ?.replace("bg-", "bg-")
                            .replace("-100", "-200") || "bg-gray-200"
                        }`}
                      >
                        {eventTypeInfo?.emoji ? (
                          <span className="text-lg">{eventTypeInfo.emoji}</span>
                        ) : (
                          <Tag className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Тип встречи</div>
                        <div className="text-sm text-gray-600">
                          {meet.subType || meet.type}
                        </div>
                        {meet.subType && meet.type && (
                          <div className="mt-1 text-xs text-gray-500">
                            Категория: {meet.type}
                          </div>
                        )}
                        {eventTypeInfo?.description && (
                          <div className="mt-1 text-xs text-gray-500">
                            {eventTypeInfo.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {meet.tags && meet.tags.length > 0 && (
                    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                        <Tag className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Тэги</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {meet.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  {meet.locations && meet.locations.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          Места встречи ({meet.locations.length})
                        </span>
                      </div>

                      <div className="space-y-3">
                        {meet.locations.map((location, index) => (
                          <div
                            key={index}
                            onClick={() =>
                              location.coordinates &&
                              handleLocationClick(location.coordinates)
                            }
                            className={`rounded-xl bg-green-50 p-4 transition-all duration-200 ${
                              location.coordinates
                                ? "cursor-pointer hover:bg-green-100 hover:shadow-md active:scale-95"
                                : ""
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="font-medium text-gray-900">
                                {location.location}
                              </div>
                            </div>

                            <div className="mb-2 text-sm text-gray-600">
                              {location.address}
                            </div>

                            {(location.starttime || location.endtime) && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700">
                                  {location.starttime && location.endtime
                                    ? `${location.starttime} - ${location.endtime}`
                                    : location.starttime
                                      ? `с ${location.starttime}`
                                      : `до ${location.endtime}`}
                                </span>
                              </div>
                            )}

                            {location.coordinates && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                                <MapPin className="h-3 w-3" />
                                <span>Нажмите для открытия на карте</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button - Fixed at bottom */}
              <div className="absolute right-4 bottom-4 left-4 z-10 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2">
                {isBlocked && !isUsersMeet && !isParticipant && !isAcceptedParticipant ? (
                  <button
                    disabled
                    className="flex w-full items-center justify-center rounded-xl bg-gray-400 py-4 font-medium text-white opacity-50"
                  >
                    {isAlreadyOwner ? "У вас уже есть встреча" : "Заблокировано"}
                    <LockIcon className="ml-2 h-4 w-4" />
                  </button>
                ) : isAcceptedParticipant && !isUsersMeet ? (
                  <button className="flex w-full items-center justify-center rounded-xl bg-green-500 py-4 font-medium text-white">
                    В карты
                  </button>
                ) : isParticipant && !isUsersMeet ? (
                  <button
                    onClick={handleJoinFastMeet}
                    className="w-full rounded-xl bg-purple-600 py-4 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    Отменить заявку
                  </button>
                ) : (
                  <button
                    onClick={handleJoinFastMeet}
                    className="w-full rounded-xl bg-purple-600 py-4 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    {isUsersMeet ? "О встрече" : "Присоединиться к встрече"}
                  </button>
                )}
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
