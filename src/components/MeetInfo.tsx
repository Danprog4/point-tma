import { useNavigate } from "@tanstack/react-router";
import React from "react";
import { getEventData, getEventFromName } from "~/lib/utils/getEventData";
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

interface User {
  id: number;
  name: string;
  surname: string;
  photo?: string;
  photoUrl?: string;
}

interface Event {
  rewards?: Array<{
    type: string;
    value: any;
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
  users?: User[];
  locations?: Location[];
  getImageUrl?: (photo: string) => string;
}

export const MeetInfo: React.FC<MeetInfoProps> = ({
  meeting,
  organizer,
  users,

  getImageUrl = (photo) => photo,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col pb-20">
      {organizer && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Организатор</div>
          <div
            className="relative flex cursor-pointer items-center gap-4"
            onClick={() => {
              navigate({
                to: "/user-profile/$id",
                params: { id: organizer?.id?.toString() || "" },
              });
            }}
          >
            <div className="relative h-10 w-10 rounded-full bg-gray-200">
              <img
                src={
                  organizer?.photo
                    ? getImageUrl(organizer?.photo)
                    : organizer?.photoUrl || ""
                }
                alt={organizer?.name || ""}
                className="h-10 w-10 cursor-pointer rounded-full"
              />
            </div>
            <div>
              {organizer?.name} {organizer?.surname}
            </div>
          </div>
        </div>
      )}

      {meeting?.description && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Описание</div>
          <div>{meeting?.description}</div>
        </div>
      )}
      {meeting?.important && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Важное</div>
          <div>{meeting?.important}</div>
        </div>
      )}
      {/* {meeting?.date && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Дата начала</div>
          <div>{meeting?.date}</div>
        </div>
      )} */}

      {meeting?.locations && meeting?.locations?.length > 0 ? (
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="text-xl font-bold">Этапы встречи</div>
          <div className="relative">
            {meeting?.locations?.map((location, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-4 last:pb-0">
                <div className="relative flex w-8 flex-none items-start justify-center">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-bold text-black">
                    {idx + 1}
                  </span>
                </div>
                {location.isCustom ? (
                  <div className="flex items-center justify-start gap-2">
                    <img
                      src={getEventFromName(location.location)?.image}
                      alt="image"
                      className="h-16 w-16 rounded-lg"
                    />
                    <div className="flex flex-col items-start justify-center">
                      <div className="text-sm font-bold">{location.location}</div>
                      <div className="text-sm">{location.address}</div>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <div>{location.starttime}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="font-bold text-black">{location.location}</div>
                    <div className="text-sm text-black/80">{location.address}</div>
                    {location.starttime && location.endtime && (
                      <div className="text-xs text-black/60">
                        {location.starttime} - {location.endtime}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="absolute top-8 bottom-4 left-4 w-px -translate-x-1/2 bg-gray-300" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Этапы вечеринки</div>
          <div>Этапы не указаны</div>
        </div>
      )}

      <div className="flex flex-col justify-center gap-2 px-4 py-4">
        <div className="flex flex-col items-start justify-start text-2xl font-bold">
          <div className="flex items-center">
            <div className="text-xl font-bold">Награда </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>За успешное посещение вы получите:</div>
          <div className="text-l pl-4 font-bold">
            +{meeting?.reward?.toLocaleString() || 0}
          </div>
          <Coin />
        </div>

        {meeting?.items && meeting.items.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {meeting.items.map((item, index) => (
              <div
                key={index}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4"
              >
                <img
                  src={getEventData(item.name, item.eventId)?.image}
                  alt={getEventData("Квест", 2)?.title || "Предмет"}
                  className="h-[61px] w-[61px] rounded-lg"
                />
                <div className="text-center text-sm font-bold text-nowrap text-[#A35700]">
                  {item.name || "Предмет"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-start text-gray-500">Предметы не указаны</div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="text-xl font-bold">Достижения</div>
        <div>+1 Активный участник</div>
      </div>
    </div>
  );
};
