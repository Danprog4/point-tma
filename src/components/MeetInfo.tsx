import { useNavigate } from "@tanstack/react-router";
import React from "react";
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
      <div className="flex flex-col gap-2 px-4 py-4">
        <div className="text-xl font-bold">Достижение</div>
        <div>+1 Активный участник</div>
      </div>

      {meeting?.important && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Важное</div>
          <div>{meeting?.important}</div>
        </div>
      )}
      {meeting?.description && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Описание</div>
          <div>{meeting?.description}</div>
        </div>
      )}
      {meeting?.date && (
        <div className="flex flex-col gap-2 px-4 py-4">
          <div className="text-xl font-bold">Дата начала</div>
          <div>{meeting?.date}</div>
        </div>
      )}

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

                <div className="flex flex-col gap-1">
                  <div className="font-bold text-black">{location.location}</div>
                  <div className="text-sm text-black/80">{location.address}</div>
                  {location.starttime && location.endtime && (
                    <div className="text-xs text-black/60">
                      {location.starttime} - {location.endtime}
                    </div>
                  )}
                </div>
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

        <div className="flex gap-2">
          <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-blue-200">
            <img src="/shit.png" alt="coin" className="h-10 w-10" />
            <span className="mt-1 text-sm">Кепка BUCS</span>
          </div>
          <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-red-200">
            <img src="/cap.png" alt="coin" className="h-10 w-10" />
            <span className="mt-1 text-sm">Любитель к...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
