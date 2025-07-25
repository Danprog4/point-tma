import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { CreateMeetDrawer } from "../CreateMeetDrawer";
import { AddPhoto } from "../Icons/AddPhoto";
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
  selectedFile,
  setSelectedFile,
  base64,
  setBase64,
  isHeicFile,
  isExtra,
  setIsExtra,
  typeOfEvent,
  item,
  date,
  setDate,
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
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  base64: string;
  setBase64: (base64: string) => void;
  isHeicFile: (file: File) => boolean;
  isExtra: boolean;
  setIsExtra: (isExtra: boolean) => void;
  typeOfEvent: string;
  item: any;
  date: string;
  setDate: (date: string) => void;
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Все");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedFile(file);

    let fileToProcess: File = file;

    // If file is HEIC, convert to PNG first
    if (isHeicFile(fileToProcess)) {
      fileToProcess = await convertHeicToPng(fileToProcess);
    }

    const base64 = await convertToBase64(fileToProcess);

    setBase64(base64);
  };
  console.log(isExtra, "isExtra");

  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center gap-4">
        <label
          htmlFor="photo-upload"
          className="flex w-full cursor-pointer flex-col items-center gap-2"
        >
          {base64 ? (
            <img
              src={base64}
              alt="photo"
              className="h-40 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-[#F0F0F0]">
              <AddPhoto />
            </div>
          )}
          <div className="text-lg text-[#9924FF]">Загрузить фото/афишу</div>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
      <div className="flex flex-col items-start gap-2 py-4 pb-4">
        <div className="text-xl font-bold">Тип встречи</div>
        <div
          onClick={() => {
            setIsDrawerOpen(true);
          }}
          className="flex h-11 w-full cursor-pointer items-center justify-between rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black opacity-50 placeholder:text-black/50"
        >
          <div>{type || "Выберите тип"}</div>
          <ChevronDown className="h-4 w-4" />
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
      <div className="flex flex-col items-start gap-2 py-4 pb-4">
        <div className="text-xl font-bold">Дата</div>
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="text"
          placeholder={`Введите дату, например 25.05.2025`}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <CreateMeetDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        setType={setType}
      />
    </div>
  );
};
