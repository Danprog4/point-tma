import { useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { Drag } from "~/components/Icons/Drag";
import { Map } from "~/components/Icons/Map";

export const Step2 = () => {
  const [type, setType] = useState<"one" | "multiple">("one");

  return (
    <>
      <div className="flex flex-col">
        <div className="mb-6 text-xl font-bold">В скольки локациях будет вечеринка?</div>
        <div className="mb-4 flex w-full gap-2">
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
          <div className="flex items-center justify-between gap-2">
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
          <div className="flex flex-col gap-4">
            <div className="mt-2 px-4 text-xl font-bold">Локации</div>
            <div className="items-between flex flex-col justify-between gap-2 px-4">
              {/* First location */}
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

              {/* Second location with bin */}
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
          </div>
        )}
      </div>
    </>
  );
};
