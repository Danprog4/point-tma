import { useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { Drag } from "~/components/Icons/Drag";
import { Map } from "~/components/Icons/Map";

export const Step2 = ({
  name,
  isBasic,
  item,
  title,
  description,
  setTitle,
  setLocation,
  setDescription,
  isDisabled,
  location,
}: {
  name: string;
  isBasic: boolean;
  item: any;
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setLocation: (location: string) => void;
  setDescription: (description: string) => void;
  isDisabled: boolean;
  location: string;
}) => {
  const [type, setType] = useState<"one" | "multiple">("one");
  const [length, setLength] = useState(2);
  return (
    <>
      {isBasic ? (
        <div className="flex flex-col overflow-y-auto pb-20">
          <div className="mb-6 text-xl font-bold">
            В скольки локациях будет вечеринка?
          </div>
          <div className="flex w-full gap-2">
            <div
              onClick={() => setType("one")}
              className={`flex-1 rounded-full py-[10px] text-center ${
                type === "one" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              В одном
            </div>
            <div
              onClick={() => setType("multiple")}
              className={`flex-1 rounded-full py-[10px] text-center ${
                type === "multiple" ? "bg-black text-white" : "bg-white text-black"
              }`}
            >
              В нескольких
            </div>
          </div>
          {type === "one" ? (
            <div className="mt-4 flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Локация вечеринки"
                className="h-11 flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
              />
              <div className="flex flex-col items-center">
                <Map />
                <div className="text-xs">На карте</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex flex-col gap-4">
                <div className="px-4 text-xl font-bold">Локации</div>
                {Array.from({ length: length }).map((_, index) => (
                  <div
                    key={index}
                    className="items-between flex flex-col justify-between gap-2 px-4"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="shrink-0 text-2xl font-bold">{index + 1}</div>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50 md:min-w-[300px]"
                      />
                      <div className="flex h-6 w-6 shrink-0 items-start">
                        <Drag />
                      </div>
                    </div>

                    <div className="flex w-[calc(100%-40px)] flex-nowrap items-center gap-2">
                      <div
                        className=""
                        onClick={() => setLength(length > 2 ? length - 1 : length)}
                      >
                        <Bin />
                        локация
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
                ))}
              </div>
              <div
                className="mt-2 text-center text-[#9924FF]"
                onClick={() => setLength(length + 1)}
              >
                Добавить
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
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
          <div className="flex w-full flex-col items-start">
            <div className="mb-2 flex w-full gap-2 text-xl font-bold">Название</div>
            <div className="mb-4 flex w-full flex-col items-start gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                type="text"
                placeholder="Введите название"
                className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
              />
            </div>
          </div>
          <div className="flex w-full flex-col items-start">
            <div className="mb-2 flex w-full gap-2 text-xl font-bold">Описание</div>
            <div className="mb-4 flex w-full flex-col items-start gap-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите предстоящее свидание"
                className="h-20 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-2 text-sm text-black placeholder:text-black/50"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};
