import { useNavigate } from "@tanstack/react-router";
import { Calendar } from "./Icons/Calendar";
import { Gift } from "./Icons/More/Gift";
import { Plus } from "./Icons/More/Plus";
import { Schedule } from "./Icons/More/Schedule";

export const More = ({
  setIsMoreOpen,
  event,
}: {
  setIsMoreOpen: (isMoreOpen: boolean) => void;
  event?: any;
}) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-10" onClick={() => setIsMoreOpen(false)}>
      <div
        className="fixed right-4 bottom-[10vh] flex h-[264px] w-[70vw] flex-col items-start justify-between rounded-xl bg-white p-7"
        style={{ boxShadow: "0px 4px 40px 0px #000000BF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex cursor-pointer items-center justify-center gap-4">
          <Gift />
          <div>Подарить</div>
        </div>
        <div
          className="flex cursor-pointer items-center justify-center gap-4"
          onClick={() => {
            navigate({
              to: "/createMeet/$name",
              params: { name: event.category },
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
        <div className="flex cursor-pointer items-center justify-center gap-4">
          <Plus />
          <div>Пригласить</div>
        </div>

        <div className="flex cursor-pointer items-center justify-center gap-4">
          <Schedule />
          <div>Добавить в календарь</div>
        </div>
      </div>
    </div>
  );
};
