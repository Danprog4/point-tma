import { useNavigate } from "@tanstack/react-router";
import { Calendar } from "./Icons/Calendar";
import { FavIcon } from "./Icons/Fav";
import { Gift } from "./Icons/More/Gift";
import { Plus } from "./Icons/More/Plus";
import { Schedule } from "./Icons/More/Schedule";

export const More = ({
  setIsMoreOpen,
  event,
  meet,
  handleSaveEventOrMeet,
  isSaved,
  handleGiveTicket,
  handleInvite,
}: {
  setIsMoreOpen: (isMoreOpen: boolean) => void;
  event?: any;
  meet?: any;
  handleSaveEventOrMeet: (meetId?: number, eventId?: number, type?: string) => void;
  isSaved?: boolean;
  handleGiveTicket: () => void;
  handleInvite: () => void;
}) => {
  const navigate = useNavigate();
  const funcProps = !meet
    ? { eventId: event?.id, type: event?.category }
    : { meetId: meet?.id };
  return (
    <div className="fixed inset-0 z-10" onClick={() => setIsMoreOpen(false)}>
      <div
        className="fixed right-4 bottom-[10vh] flex h-[264px] w-[70vw] flex-col items-start justify-between rounded-xl bg-white p-7"
        style={{ boxShadow: "0px 4px 40px 0px #000000BF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex cursor-pointer items-center justify-center gap-4"
          onClick={handleGiveTicket}
        >
          <Gift />
          <div>Подарить</div>
        </div>
        {event && (
          <div
            className="flex cursor-pointer items-center justify-center gap-4"
            onClick={() => {
              navigate({
                to: "/createMeet",
                search: {
                  step: 0,
                  isExtra: true,
                  isBasic: false,
                  typeOfEvent: event.category,
                  item: event,
                },
              });
            }}
          >
            <Calendar />
            <div>Создать встречу</div>
          </div>
        )}
        <div
          className="flex cursor-pointer items-center justify-center gap-4"
          onClick={() => {
            if (meet) {
              handleSaveEventOrMeet(funcProps.meetId);
            } else {
              handleSaveEventOrMeet(undefined, funcProps.eventId, funcProps.type);
            }
          }}
        >
          <FavIcon width="32" height="32" />
          <div className="text-nowrap">
            {isSaved ? "Удалить из избранного" : "Добавить в избранное"}
          </div>
        </div>
        <div
          className="flex cursor-pointer items-center justify-center gap-4"
          onClick={handleInvite}
        >
          <Plus />
          <div>Пригласить</div>
        </div>

        <div className="flex cursor-pointer items-center justify-center gap-4">
          <Schedule />
          <div>Хочу пойти</div>
        </div>
      </div>
    </div>
  );
};
