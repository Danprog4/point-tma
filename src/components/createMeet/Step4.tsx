import { useEffect } from "react";
import { Left } from "./images/Left";
import { Right } from "./images/Right";
export const Step4 = ({
  isLoading,
  setIsLoading,
}: {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) => {
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="">
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-8 text-center text-xl font-bold text-[#2462FF]">
            Создаем ваш квест
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
                <div className="rounded-2xl bg-white px-2 text-gray-600">Квест</div>
                <div className="rounded-2xl bg-white px-2 text-gray-600">3000</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold text-gray-600">Квест для дизайнера</div>
                <div className="text-sm text-gray-400">Получи любой курс...</div>
              </div>
            </div>
            <Right />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-8 text-center text-xl font-bold text-[#00A349]">
            Квест создан!
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
                <div className="rounded-2xl bg-white px-2">Квест</div>
                <div className="rounded-2xl bg-white px-2">3000</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-xl font-bold">Квест для дизайнера</div>
                <div className="text-sm">Получи любой курс...</div>
              </div>
            </div>
            <Right />
          </div>
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
