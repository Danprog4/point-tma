import imageCompression from "browser-image-compression";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { CreateMeetDrawer } from "../CreateMeetDrawer";
import { DatePicker } from "../DatePicker";
import { AddPhoto } from "../Icons/AddPhoto";
export const Step1 = ({
  type,
  setType,
  subType,
  setSubType,
  title,
  setTitle,
  description,
  setDescription,

  setSelectedFile,
  base64,
  setBase64,
  isHeicFile,
  isExtra,

  date,
  setDate,

  setIsDisabled,
}: {
  subType: string;
  setSubType: (subType: string) => void;
  isDisabled: boolean;
  setIsDisabled: (isDisabled: boolean) => void;
  name: string;
  isBasic: boolean;
  type: string;
  setType: (type: string) => void;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  setStep: (step: number) => void;
  setTypeOfEvent: (type: string) => void;
  title: string;
  setTitle: (title: string) => void;
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    let fileToProcess: File = file;
    if (isHeicFile(fileToProcess)) {
      try {
        fileToProcess = await convertHeicToPng(fileToProcess);
      } catch (error: any) {
        toast.error(`❌ Преобразование HEIC в PNG не удалось: ${error.message}`);
        return;
      }
    }
    // Compress image to 1MB max
    try {
      const compressedFile = await imageCompression(fileToProcess, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      fileToProcess = compressedFile;
    } catch (error: any) {
      toast.error(`❌ Сжатие изображения не удалось: ${error.message}`);
      return;
    }
    let base64str: string;
    try {
      base64str = await convertToBase64(fileToProcess);
    } catch (error: any) {
      toast.error(`❌ Преобразование в Base64 не удалось: ${error.message}`);
      return;
    }
    setBase64(base64str);
  };

  useEffect(() => {
    if (title && description && type && base64 && date) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [title, description, type, base64, date]);

  console.log(isExtra, "isExtra");

  const monthValue = date.split(".")[1] || "";

  return (
    <div className="scrollbar-hidden w-full overflow-y-auto pb-20">
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
          <div>{subType || type || "Выберите тип"}</div>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-col items-start gap-2 py-4 pb-4">
        <div className="text-xl font-bold">Название</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          type="text"
          placeholder={`Введите название`}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <div className="flex flex-col items-start gap-2 pb-4">
        <div className="text-xl font-bold">Описание</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Введите описание`}
          className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <DatePicker birthday={date} setBirthday={setDate} monthValue={monthValue} />
      <CreateMeetDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        setType={setType}
        type={type}
        subType={subType}
        setSubType={setSubType}
      />
    </div>
  );
};
