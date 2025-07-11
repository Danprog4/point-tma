import { Bin } from "../Icons/Bin";
import { Drag } from "../Icons/Drag";

export const Step4 = ({
  name,
  isBasic,
  item,
}: {
  name: string;
  isBasic: boolean;
  item: any;
}) => {
  return (
    <>
      {isBasic ? (
        <>
          <div className="mb-4 text-xl font-bold">Укажите вознаграждение за участие</div>
          <div className="mb-4 flex flex-col items-start gap-2">
            <input
              type="text"
              placeholder="Локация вечеринки"
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
            <div className="px-4 text-xs">
              Укажите количество поинтов для прохождения квеста
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col overflow-y-auto pb-20">
          <div>
            <div className="relative h-[25vh] w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 flex gap-1 text-black">
                <div className="rounded-full bg-white p-1 text-sm">{item.date}</div>
                <div className="rounded-full bg-white p-1 text-sm">{item.price}</div>
              </div>
            </div>
            <div className="flex flex-col p-2">
              <div className="flex text-start">{item.title}</div>
              <div className="text-sm text-gray-500">
                {item.description?.slice(0, 40) +
                  (item.description?.length > 40 ? "..." : "")}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="mt-2 px-4 text-xl font-bold">Локации</div>
            <div className="items-between flex flex-col justify-between gap-2 px-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="shrink-0 text-2xl font-bold">1</div>
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50 md:min-w-[300px]"
                />
                <div className="flex h-6 w-6 shrink-0 items-start">
                  <Drag />
                </div>
              </div>

              <div className="flex w-[calc(100%-40px)] flex-nowrap items-center gap-2">
                <div className="">
                  <Bin />
                </div>
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="h-11 w-[calc(100%-24px)] flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="h-11 w-[calc(100%-24px)] flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />
              </div>
            </div>
            <div className="items-between flex flex-col justify-between gap-2 px-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="shrink-0 text-2xl font-bold">2</div>
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50 md:min-w-[300px]"
                />
                <div className="flex h-6 w-6 shrink-0 items-start">
                  <Drag />
                </div>
              </div>

              <div className="flex w-[calc(100%-40px)] flex-nowrap items-center gap-2">
                <div className="">
                  <Bin />
                </div>
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="h-11 w-[calc(100%-24px)] flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />
                <input
                  type="text"
                  placeholder="Введите адрес"
                  className="h-11 w-[calc(100%-24px)] flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />
              </div>
            </div>
            <div className="text-center text-[#9924FF]">Добавить</div>
          </div>
        </div>
      )}
    </>
  );
};
