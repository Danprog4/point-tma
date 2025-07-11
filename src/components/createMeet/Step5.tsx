import { useEffect } from "react";
import { Left } from "./images/Left";
import { Right } from "./images/Right";

export const Step5 = ({
  isLoading,
  setIsLoading,
  name,
  item,
  type,
  eventType,
  isBasic,
  title2,
  description2,
}: {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  name: string;
  item: any;
  type: string;
  eventType: string;
  isBasic: boolean;
  title2: string;
  description2: string;
}) => {
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  // Defensive helpers without excessive typeof checks
  const price = item?.price ?? title2;
  const title = item?.title ?? title2;
  const descRaw = item?.description ?? description2 ?? "";
  const desc = descRaw.length > 20 ? descRaw.slice(0, 20) + "..." : descRaw;

  return (
    <div className="">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-8 text-center text-xl font-bold text-[#2462FF]">
            Создаем ваш {type || name}
          </div>
          <div className="flex w-full items-center justify-between gap-4">
            <Left />
            <div className="relative flex flex-col items-center gap-2 opacity-50">
              <img
                src="/quest.png"
                alt="quest"
                className="max-h-[150px] max-w-[250px] rounded-2xl object-cover"
              />
              <div className="absolute bottom-16 left-2 flex items-center justify-center gap-2 text-sm font-bold">
                <div className="rounded-2xl bg-white px-2 text-gray-600">{type}</div>
                <div className="rounded-2xl bg-white px-2 text-gray-600">{price}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold text-gray-600">{title}</div>
                <div className="text-sm text-gray-400">{desc}</div>
              </div>
            </div>
            <Right />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-8 text-center text-xl font-bold text-[#00A349]">
            {type || name} создан!
          </div>
          <div className="mb-6 flex w-full items-center justify-between gap-4">
            <Left />
            <div className="relative flex flex-col items-center gap-2">
              <img
                src="/quest.png"
                alt="quest"
                className="max-h-[150px] max-w-[250px] rounded-2xl object-cover"
              />
              <div className="absolute bottom-16 left-2 flex items-center justify-center gap-2 text-sm font-bold">
                <div className="rounded-2xl bg-white px-2">{type}</div>
                <div className="rounded-2xl bg-white px-2">{price}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold">{title}</div>
                <div className="text-sm text-gray-400">{desc}</div>
              </div>
            </div>
            <Right />
          </div>{" "}
          <div className="flex flex-col gap-4 px-4">
            <div>
              Ваше событие добавлено в ленту событий и будет отображаться первым в списке
              афиши, чтобы не потерять
            </div>
            <div>Начните приглашать людей</div>
          </div>
        </div>
      )}
    </div>
  );
};
