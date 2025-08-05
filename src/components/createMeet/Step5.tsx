import { Left } from "./images/Left";
import { Right } from "./images/Right";

export const Step5 = ({
  isLoading,

  item,
  type,

  title,
  description,

  base64,
}: {
  isLoading: boolean;

  item: any;
  type: string;
  eventType: string;
  isBasic: boolean;
  title: string;
  description: string;
  reward: number;
  setReward: (reward: number) => void;
  base64: string;
}) => {
  const descRaw = item?.description ?? description ?? "";
  const desc = descRaw.length > 20 ? descRaw.slice(0, 20) + "..." : descRaw;

  return (
    <div className="">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-8 text-center text-xl font-bold text-[#2462FF]">
            Создаем вашу встречу
          </div>
          <div className="flex w-full items-center justify-between gap-4">
            <Left />
            <div className="relative flex flex-col items-center gap-2">
              <img
                src={base64}
                alt="quest"
                className="h-[20vh] w-[60vw] rounded-2xl object-cover"
              />
              <div className="absolute bottom-10 left-2 flex items-center justify-center gap-2 text-sm font-bold">
                <div className="rounded-2xl bg-white px-2">{type}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold">{title}</div>
              </div>
            </div>
            <Right />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-8 text-center text-xl font-bold text-[#00A349]">
            Встреча создана!
          </div>
          <div className="mb-6 flex w-full items-center justify-between gap-4">
            <Left />
            <div className="relative flex flex-col items-center gap-2">
              <img
                src={base64}
                alt="quest"
                className="h-[20vh] w-[60vw] rounded-2xl object-cover"
              />
              <div className="absolute bottom-10 left-2 flex items-center justify-center gap-2 text-sm font-bold">
                <div className="rounded-2xl bg-white px-2">{type}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold">{title}</div>
              </div>
            </div>
            <Right />
          </div>
        </div>
      )}
    </div>
  );
};
