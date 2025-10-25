import { useQuery } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { CreateMeetDrawer } from "../CreateMeetDrawer";
import DatePicker2 from "../DatePicker2";
import { AddPhoto } from "../Icons/AddPhoto";
import { PlusIcon } from "../Icons/Plus";
import TimePicker from "../TimePicker";

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
  gallery,
  setGallery,
  mainPhotoRaw,
  setMainPhotoRaw,
  isHeicFile,
  isExtra,

  date,
  setDate,
  time,
  setTime,
  setIsDisabled,
  calendarDate,
  city,
  setCity,
}: {
  subType: string;
  setSubType: (subType: string) => void;
  isDisabled: boolean;
  setIsDisabled: (isDisabled: boolean) => void;
  name: string;
  isBasic: boolean;
  type: string;
  setType: (type: string) => void;

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
  gallery: string[];
  setGallery: (gallery: string[] | ((prev: string[]) => string[])) => void;
  mainPhotoRaw: string;
  setMainPhotoRaw: (mainPhotoRaw: string) => void;
  isHeicFile: (file: File) => boolean;
  isExtra: boolean;
  setIsExtra: (isExtra: boolean) => void;
  typeOfEvent: string;

  date: Date | null;
  setDate: (date: Date) => void;
  time: Date | null;
  setTime: (time: Date) => void;
  calendarDate: string;
  city: string;
  setCity: (city: string) => void;
}) => {
  const trpc = useTRPC();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Все");

  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];

  const { data: eventsData } = useQuery(trpc.event.getEvents.queryOptions());

  let data: any[] = [];

  switch (activeFilter) {
    case "Все":
      data = eventsData || [];
      break;
    case "Квесты":
      data = eventsData?.filter((event) => event.category === "Квест") || [];
      break;
    case "Кино":
      data = eventsData?.filter((event) => event.category === "Кино") || [];
      break;
    case "Конференции":
      data = eventsData?.filter((event) => event.category === "Конференция") || [];
      break;
    case "Вечеринки":
      data = eventsData?.filter((event) => event.category === "Вечеринка") || [];
      break;
    case "Нетворкинг":
      data = eventsData?.filter((event) => event.category === "Нетворкинг") || [];
      break;
    default:
      data = [];
  }

  useEffect(() => {
    if (calendarDate) {
      const calendarDateObj = new Date(calendarDate);
      const formattedDate = calendarDateObj.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      setDate(new Date(formattedDate));
    }
  }, [calendarDate]);

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
    setMainPhotoRaw(base64str);
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let fileToProcess = file;
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
    setGallery((prev) => [...prev, base64str]);
  };

  // Handler to delete gallery photo on click and set main photo to next or clear
  const handleGalleryClick = (item: string) => {
    setGallery((prev) => {
      const newGallery = prev.filter((i) => i !== item);
      if (mainPhotoRaw) newGallery.push(mainPhotoRaw);
      return newGallery;
    });
    setMainPhotoRaw(item);
    setBase64(item.startsWith("data:image/") ? item : getImageUrl(item));
    setSelectedFile(null);
  };

  // Handler to delete main photo without triggering input
  const handleDeletePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (gallery.length > 0) {
      const [first, ...rest] = gallery;
      // Promote first gallery photo to main in UI
      setGallery(rest);
      setMainPhotoRaw(first);
      setBase64(first.startsWith("data:image/") ? first : getImageUrl(first));
      setSelectedFile(null);
    } else {
      // No gallery photos, just clear main photo in UI
      setBase64("");
      setMainPhotoRaw("");
      setSelectedFile(null);
    }
  };

  useEffect(() => {
    if (title && description && type && base64 && date) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [title, description, type, base64, date]);

  return (
    <div className="scrollbar-hidden w-full overflow-y-auto pb-4">
      <div className="mt-8 flex w-full flex-col items-center gap-4">
        <label
          htmlFor="photo-upload"
          className="flex w-full cursor-pointer flex-col items-center gap-2"
        >
          {base64 ? (
            <div className="relative w-full">
              <img src={base64} alt="photo" className="mb-2 h-90 w-full object-cover" />
              <div className="absolute right-0 bottom-2 flex w-full items-center justify-center gap-20 bg-[#12121280] px-4 py-2 text-white">
                <div>Изменить</div>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex h-90 w-full items-center justify-center rounded-t-2xl bg-[#F0F0F0]">
              <div className="flex flex-col items-center gap-2">
                <AddPhoto />
                <div className="text-sm text-[#9924FF]">Загрузить фото/афишу *</div>
              </div>
            </div>
          )}
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      <div className="px-4">
        <div className="mb-4 text-2xl font-bold">Галерея</div>
        <div className="mb-4 flex flex-wrap gap-4">
          {gallery.map((item, idx) => {
            const isBase64 = typeof item === "string" && item.startsWith("data:image/");
            return (
              <div
                key={item || idx}
                onClick={() => handleGalleryClick(item)}
                className="flex aspect-square w-[21.5%] cursor-pointer items-center justify-center rounded-lg bg-[#F3E5FF]"
              >
                <img
                  src={isBase64 ? item : getImageUrl(item)}
                  alt={`Галерея ${idx + 1}`}
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
            );
          })}

          <label
            htmlFor="gallery-upload"
            className="flex aspect-square w-[21.5%] cursor-pointer items-center justify-center rounded-lg bg-[#F3E5FF]"
          >
            <div className="flex flex-col items-center gap-1 px-2">
              <PlusIcon />
              <div className="text-center text-xs text-[#9924FF]">добавить еще</div>
            </div>
          </label>
          <input
            id="gallery-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddGallery}
          />
        </div>

        <div className="flex w-full flex-col items-start gap-2 pb-4">
          <div className="text-xl font-bold">Дата *</div>
          <div className="w-full">
            <DatePicker2 value={date} setDate={setDate} />
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-2 pb-4">
          <div className="text-xl font-bold">Время *</div>
          <div className="w-full">
            <TimePicker value={time} setTime={setTime} placeholder="Выберите время" />
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 py-4 pb-4">
          <div className="text-xl font-bold">Тип встречи *</div>
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
          <div className="text-xl font-bold">Название *</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder={`Введите название`}
            className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
          />
        </div>
        <div className="flex flex-col items-start gap-2 pb-4">
          <div className="text-xl font-bold">Описание *</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Введите описание`}
            className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
          />
        </div>
      </div>

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
