import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import FilterDrawer from "../FilterDrawer";
import { WhiteFilter } from "../Icons/WhiteFilter";
import { ExtraStep1 } from "./ExtraStep1";

export const Step1 = ({
  name,
  isBasic,
  type,
  setType,
  selectedItem,
  setSelectedItem,
  setStep,
  setTypeOfEvent,
  title2,
  setTitle2,
  description2,
  setDescription2,
  description,
  setDescription,
}: {
  name: string;
  isBasic: boolean;
  type: string;
  setType: (type: string) => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  setStep: (step: number) => void;
  setTypeOfEvent: (type: string) => void;
  title2: string;
  setTitle2: (title: string) => void;
  description2: string;
  setDescription2: (description: string) => void;
  description: string;
  setDescription: (description: string) => void;
}) => {
  const [isExtra, setIsExtra] = useState(false);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Все");

  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];

  let data: any[] = [];

  switch (activeFilter) {
    case "Все":
      data = [
        ...questsData,
        ...kinoData,
        ...conferencesData,
        ...networkingData,
        ...partiesData,
      ];
      break;
    case "Квесты":
      data = questsData;
      console.log(data);
      break;
    case "Кино":
      data = kinoData;
      break;
    case "Конференции":
      data = conferencesData;
      break;
    case "Вечеринки":
      data = partiesData;
      break;
    case "Нетворкинг":
      data = networkingData;
      break;
    default:
      data = [];
  }

  return (
    <>
      {isBasic ? (
        <>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-[#F0F0F0]"></div>
            <div className="text-lg text-[#9924FF]">
              Загрузить фото/афишу для вечеринки
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 py-4 pb-4">
            <div className="text-xl font-bold">Название</div>
            <input
              value={title2}
              onChange={(e) => setTitle2(e.target.value)}
              type="text"
              placeholder={`Введите название`}
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
          </div>
          <div className="flex flex-col items-start gap-2">
            <div className="text-xl font-bold">Описание</div>
            <textarea
              value={description2}
              onChange={(e) => setDescription2(e.target.value)}
              placeholder={`Введите описание`}
              className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
            />
          </div>
        </>
      ) : isExtra ? (
        <ExtraStep1 item={selectedItem} type={type} setType={setType} setStep={setStep} />
      ) : (
        <div className="overflow-y-auto">
          <div className="scrollbar-hidden mb-4 flex items-center justify-center gap-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Поиск квестов"
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />

            <FilterDrawer open={isOpen} onOpenChange={setIsOpen}>
              <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
                <WhiteFilter />
              </div>
            </FilterDrawer>
          </div>
          <div className="mb-4 flex w-full items-center gap-6 overflow-x-auto">
            {filters.map((filter, index) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? "bg-black text-white"
                    : "border-gray-200 bg-white text-black"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedItem(item);
                  setIsExtra(true);
                  setTypeOfEvent(item.category);
                }}
              >
                <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
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
                    {item.description?.slice(0, 10) +
                      (item.description?.length > 10 ? "..." : "")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
