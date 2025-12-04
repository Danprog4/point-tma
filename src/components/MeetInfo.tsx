import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import React from "react";
import { User } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";
import { Coin } from "./Icons/Coin";

interface Meeting {
  id: number;
  name?: string;
  description?: string;
  type?: string;
  participantsIds?: string[];
  locations?: Array<{
    location: string;
    address: string;
    starttime?: string;
    endtime?: string;
    isCustom?: boolean;
  }>;
  important?: string;
  date?: string;
  reward?: number;
  image?: string;
  createdAt?: Date;
  userId?: number;
  isCompleted?: boolean;
  gallery?: string[];
  subType?: string;
  isBig?: boolean;
  items?: Array<{
    type: string;
    eventId: number;
    isActive?: boolean;
    name: string;
    id?: number;
  }>;
}

interface Organizer {
  id: number;
  name: string;
  surname: string;
  photo?: string;
  photoUrl?: string;
}

interface MeetInfoProps {
  meeting?: Meeting;
  organizer?: Organizer;
  user?: User;
  users?: User[];

  locations?: Location[];
  getImageUrl?: (photo: string) => string;
}

export const MeetInfo: React.FC<MeetInfoProps> = ({
  meeting,
  organizer,
  user,
  users,

  getImageUrl = (photo) => photo,
}) => {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());

  const isUserHave = (location: any) => {
    const eventId = events?.find((event) => event.title === location.location)?.id;
    const category = events?.find((event) => event.title === location.location)?.category;
    return user?.inventory?.some(
      (item: any) =>
        item.eventId === eventId && item.name === category && item.type === "ticket",
    );
  };

  const getLinkToEvent = (location: any) => {
    const eventId = events?.find((event) => event.title === location.location)?.id;
    const category = events?.find((event) => event.title === location.location)?.category;
    return `/event/${category}/${eventId}`;
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-24">
      {organizer && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md">
          <div className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            Организатор
          </div>
          <div
            className="flex cursor-pointer items-center gap-4"
            onClick={() => {
              navigate({
                to: "/user-profile/$id",
                params: { id: organizer?.id?.toString() || "" },
              });
            }}
          >
            <div className="relative h-12 w-12 flex-none rounded-full bg-gray-100 ring-2 ring-white">
              <img
                src={
                  organizer?.photo
                    ? getImageUrl(organizer?.photo)
                    : organizer?.photoUrl || ""
                }
                alt={organizer?.name || ""}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="text-lg font-bold text-gray-900">
                {organizer?.name} {organizer?.surname}
              </div>
              <div className="text-sm font-medium text-purple-600">
                Посмотреть профиль
              </div>
            </div>
          </div>
        </div>
      )}

      {(meeting?.description || meeting?.important) && (
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          {meeting?.description && (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                Описание
              </div>
              <div className="leading-relaxed text-gray-700">{meeting?.description}</div>
            </div>
          )}
          {meeting?.description && meeting?.important && (
            <div className="h-px w-full bg-gray-100" />
          )}
          {meeting?.important && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-red-500 uppercase">
                Важное
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-800">
                {meeting?.important}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Locations / Stages */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Этапы встречи
        </div>

        {meeting?.locations && meeting?.locations?.length > 0 ? (
          <div className="relative pl-2">
            {/* Timeline Line */}
            <div className="absolute top-4 bottom-4 left-[15px] w-0.5 bg-gray-100" />

            {meeting?.locations?.map((location, idx) => (
              <div key={idx} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Timeline Dot */}
                <div className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white ring-4 ring-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 ring-1 ring-purple-200">
                    {idx + 1}
                  </span>
                </div>

                {!location.isCustom ? (
                  <div className="flex flex-1 flex-col gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                    <div className="flex items-start gap-3">
                      {events?.find((event) => event.title === location.location)
                        ?.image && (
                        <img
                          src={
                            events?.find((event) => event.title === location.location)
                              ?.image ?? ""
                          }
                          alt="location"
                          className="h-16 w-16 rounded-lg bg-gray-200 object-cover"
                        />
                      )}
                      <div className="flex flex-col">
                        <div className="font-bold text-gray-900">{location.location}</div>
                        <div className="text-sm text-gray-500">{location.address}</div>
                        {location.starttime && (
                          <div className="mt-1 text-xs font-medium text-gray-400">
                            {location.starttime}
                          </div>
                        )}
                      </div>
                    </div>

                    {isUserHave(location) ? (
                      <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm font-medium text-green-600">
                        <Check className="h-4 w-4" /> Билет получен
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                          Билет не получен
                        </div>
                        <Link
                          className="px-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                          to={getLinkToEvent(location)}
                        >
                          Приобрести билет →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col gap-1 rounded-xl bg-gray-50 p-3">
                    <div className="font-bold text-gray-900">{location.location}</div>
                    <div className="text-sm text-gray-500">{location.address}</div>
                    {location.starttime && location.endtime && (
                      <div className="text-xs font-medium text-gray-400">
                        {location.starttime} - {location.endtime}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-sm text-gray-400 italic">Этапы не указаны</div>
        )}
      </div>

      {/* Rewards */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            Награда
          </div>
          <div className="flex items-center gap-2 rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1">
            <span className="font-bold text-yellow-700">
              +{meeting?.reward?.toLocaleString() || 0}
            </span>
            <Coin />
          </div>
        </div>

        {meeting?.items && meeting.items.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {meeting.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center gap-2 rounded-xl bg-purple-50 p-3 ring-1 ring-purple-100"
              >
                <img
                  src={
                    events?.find(
                      (event) =>
                        event.id === item.eventId && event.category === item.name,
                    )?.image ?? ""
                  }
                  alt={item.name}
                  className="h-12 w-12 object-contain"
                />
                <div className="line-clamp-1 text-center text-xs font-bold text-purple-900">
                  {item.name || "Предмет"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">Предметы не указаны</div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white shadow-md">
        <div className="font-bold">Достижения</div>
        <div className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1 backdrop-blur-md">
          <span className="text-sm font-medium">+1 Активный участник</span>
        </div>
      </div>
    </div>
  );
};
