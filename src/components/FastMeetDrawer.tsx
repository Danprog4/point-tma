import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, LockIcon, MapPin, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { FastMeet, User as UserType } from "~/db/schema";
import { usePeopleGallery } from "~/hooks";
import { useFastMeet } from "~/hooks/useFastMeet";
import { getImage } from "~/lib/utils/getImage";
import { getYMaspAdress } from "~/lib/utils/getYMaspAdress";
import { useTRPC } from "~/trpc/init/react";
import { eventTypes } from "~/types/events";
import { FastMeetInfo } from "./FastMeetInfo";
import { FastMeetParticipantsList } from "./FastMeetParticipantsList";
import { UserPhoto } from "./people";

export default function FastMeetDrawer({
  open,
  onOpenChange,
  meet,
  currentUser,
  preOpenFastMeetId,
  cameFromList,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meet: FastMeet | null;
  currentUser: UserType | null;
  preOpenFastMeetId?: number;
  cameFromList?: boolean;
}) {
  // Don't render anything if meet is null
  if (!meet) {
    return null;
  }

  // Получаем данные из хука для логики кнопок
  const {
    isOrganizer,
    users,
    organizerUser,
    meet: liveMeet,
    isBlocked,
    isParticipant,
    isAcceptedParticipant,
    isAlreadyOwner,
    handleJoinFastMeet,
    isMoreOpen,
    setIsMoreOpen,
    meetParticipantsCount,
    pendingRequests,
    acceptedParticipants,
  } = useFastMeet(meet.id);

  const galleryData = usePeopleGallery(users || []);

  const {
    touchStartXRef,
    touchEndXRef,
    didSwipeRef,
    handleSwipe,
    openFullScreen,
    getUserPhotoData,
  } = galleryData;

  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  useEffect(() => {
    if (preOpenFastMeetId !== undefined && preOpenFastMeetId) {
      setIsMoreOpen(true);
    }
  }, [setIsMoreOpen]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!organizerUser) {
      console.log("no user in handleTouchStart");
      return;
    }
    touchStartXRef.current[organizerUser.id] = e.touches[0].clientX;
    touchEndXRef.current[organizerUser.id] = e.touches[0].clientX;
    didSwipeRef.current[organizerUser.id] = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!organizerUser) {
      console.log("no user in handleTouchMove");
      return;
    }
    touchEndXRef.current[organizerUser.id] = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!organizerUser) {
      console.log("no user in handleTouchEnd");
      return;
    }
    const startX = touchStartXRef.current[organizerUser.id] ?? 0;
    const endX = touchEndXRef.current[organizerUser.id] ?? 0;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) > 50) {
      didSwipeRef.current[organizerUser.id] = true;
      if (deltaX < 0) handleSwipe(organizerUser.id, "left");
      else handleSwipe(organizerUser.id, "right");
      // Prevent immediate click after swipe
      setTimeout(() => {
        didSwipeRef.current[organizerUser.id] = false;
      }, 0);
    }
  };

  const currentMeet = (liveMeet ?? meet) as FastMeet;
  const eventTypeInfo = currentMeet.type ? getEventTypeInfo(currentMeet.type) : null;
  const photoData = getUserPhotoData(organizerUser?.id!);

  const isUsersMeet = currentMeet.userId === currentUser?.id;

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
                if (isMoreOpen) {
                  setIsMoreOpen(false);
                } else {
                  onOpenChange(false);
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          {isMoreOpen ? (
            <FastMeetInfo
              meet={currentMeet}
              currentUser={currentUser}
              setIsMoreOpen={setIsMoreOpen}
              onOpenChange={onOpenChange}
              cameFromList={cameFromList}
            />
          ) : (
            <>
              <div className="scrollbar-hidden flex-1 overflow-y-auto pb-24">
                <UserPhoto
                  user={organizerUser}
                  photoData={photoData}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {}}
                  onMoreClick={() => {}}
                  isFastMeet
                />
                <div className="px-4 pt-4">
                  {organizerUser && organizerUser.bio && (
                    <div className="text-sm">{organizerUser.bio}</div>
                  )}
                </div>
                {/* Title and Description */}
                <div className="px-4 py-4">
                  <div className="mb-6">
                    <h2 className="mb-2 text-xl font-bold text-gray-900">
                      {currentMeet.name}
                    </h2>
                    {currentMeet.description && (
                      <p className="leading-relaxed">{currentMeet.description}</p>
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
                          {formatDate(currentMeet.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Event Type */}
                    {(currentMeet.type || currentMeet.subType) && (
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
                            {currentMeet.subType || currentMeet.type}
                          </div>
                          {currentMeet.subType && currentMeet.type && (
                            <div className="mt-1 text-xs text-gray-500">
                              Категория: {currentMeet.type}
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
                    {currentMeet.tags && currentMeet.tags.length > 0 && (
                      <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                          <Tag className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Тэги</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentMeet.tags.map((tag, index) => (
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

                    {/* Participants */}
                    <div className="flex flex-col items-start gap-3 rounded-xl bg-indigo-50 p-4">
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div> */}
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">Участники</div>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-1">
                                <div className="font-bold text-blue-600">
                                  {meetParticipantsCount + 1}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Organizer */}
                      {organizerUser && (
                        <div className="flex items-center gap-3">
                          <img
                            src={getImage(organizerUser, "")}
                            alt={`${organizerUser.name} ${organizerUser.surname}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">
                              {organizerUser.name} {organizerUser.surname}
                            </div>
                            <div className="text-sm text-gray-500">Организатор</div>
                          </div>
                        </div>
                      )}

                      {/* Accepted Participants */}
                      {acceptedParticipants.length > 0 && (
                        <div className="space-y-4">
                          {acceptedParticipants.map((participant) => {
                            const user = users?.find((u) => u.id === participant.userId);
                            if (!user) return null;

                            return (
                              <div
                                key={participant.id}
                                className="flex items-center gap-3"
                              >
                                <img
                                  src={getImage(user, "")}
                                  alt={`${user.name} ${user.surname}`}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                  <div className="font-medium text-gray-900">
                                    {user.name} {user.surname}
                                  </div>
                                  <div className="text-sm text-gray-500">Участник</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {pendingRequests.length > 0 && (
                        <div className="space-y-4">
                          {pendingRequests.map((participant) => {
                            const user = users?.find((u) => u.id === participant.userId);
                            if (!user) return null;

                            return (
                              <div
                                key={participant.id}
                                className="flex items-center gap-3"
                              >
                                <img
                                  src={getImage(user, "")}
                                  alt={`${user.name} ${user.surname}`}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                  <div className="font-medium text-gray-900">
                                    {user.name} {user.surname}
                                  </div>
                                  <div className="text-sm text-orange-500">
                                    Ожидает подтверждения
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Locations */}
                    {currentMeet.locations && currentMeet.locations.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-900">
                            Места встречи ({currentMeet.locations.length})
                          </span>
                        </div>

                        <div className="space-y-3">
                          {currentMeet.locations.map((location, index) => (
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
              </div>

              {/* Action Button - Fixed at bottom */}
              <div className="absolute right-4 bottom-0 left-4 z-10 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
                {isBlocked && !isUsersMeet && !isParticipant && !isAcceptedParticipant ? (
                  <button
                    disabled
                    className="flex w-full items-center justify-center rounded-xl bg-gray-400 py-3 font-medium text-white opacity-50"
                  >
                    {isAlreadyOwner ? "У вас уже есть встреча" : "Заблокировано"}
                    <LockIcon className="ml-2 h-4 w-4" />
                  </button>
                ) : isAcceptedParticipant && !isUsersMeet ? (
                  <button
                    onClick={() => {
                      onOpenChange(true);
                    }}
                    className="flex w-full items-center justify-center rounded-xl bg-purple-600 py-3 font-medium text-white"
                  >
                    О встрече
                  </button>
                ) : isParticipant && !isUsersMeet ? (
                  <button
                    onClick={handleJoinFastMeet}
                    className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    Отменить заявку
                  </button>
                ) : (
                  <button
                    onClick={handleJoinFastMeet}
                    className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    {isUsersMeet ? "О встрече" : "Присоединиться к встрече"}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Nested Participants Drawer */}
          <Drawer.NestedRoot
            open={isParticipantsOpen}
            onOpenChange={setIsParticipantsOpen}
          >
            <Drawer.Portal>
              <Drawer.Overlay
                className="fixed inset-0 z-[200] bg-black/40"
                onClick={(e) => e.preventDefault()}
              />
              <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[300] mt-24 flex h-fit max-h-[45%] flex-col rounded-t-[10px] bg-gray-100 lg:h-[327px]">
                <div className="flex flex-col px-4">
                  <header className="flex items-center justify-center py-3">
                    <div className="flex justify-center font-bold">Участники встречи</div>
                  </header>
                  <div className="flex-1 overflow-y-auto pb-4">
                    <FastMeetParticipantsList
                      meetId={currentMeet.id}
                      currentUser={currentUser}
                    />
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.NestedRoot>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
