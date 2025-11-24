import { useQuery } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { ChevronDown, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { CreateMeetDrawer } from "../CreateMeetDrawer";
import DatePicker2 from "../DatePicker2";
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

  const { data: eventsData } = useQuery(trpc.event.getEvents.queryOptions());

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

  useEffect(() => {
    if (title && description && type && base64 && date) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [title, description, type, base64, date]);

  return (
    <div className="scrollbar-hidden w-full overflow-y-auto px-4 pb-8">
      {/* Photo Upload Section */}
      <div className="mt-4 flex w-full flex-col items-center gap-4">
        <label
          htmlFor="photo-upload"
          className="group relative flex w-full cursor-pointer flex-col items-center gap-2 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:ring-violet-200 active:scale-[0.99]"
        >
          {base64 ? (
            <div className="relative h-64 w-full">
              <img src={base64} alt="photo" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-full bg-white/20 px-4 py-2 font-medium text-white backdrop-blur-md">
                  Изменить обложку
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 w-full flex-col items-center justify-center bg-gray-50 text-gray-400 transition-colors group-hover:bg-gray-100">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-100">
                <ImageIcon className="h-8 w-8 text-violet-500" />
              </div>
              <div className="mt-3 font-medium text-gray-900">Добавить обложку</div>
              <div className="mt-1 text-sm text-gray-500">
                Рекомендуемый размер 1920x1080
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

      {/* Gallery Section */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Галерея</h3>
          <span className="text-sm text-gray-500">{gallery.length} фото</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <label
            htmlFor="gallery-upload"
            className="flex h-20 w-20 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-violet-300 hover:bg-violet-50"
          >
            <PlusIcon />
            <input
              id="gallery-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddGallery}
            />
          </label>
          {gallery.map((item, idx) => {
            const isBase64 = typeof item === "string" && item.startsWith("data:image/");
            return (
              <div
                key={item || idx}
                onClick={() => handleGalleryClick(item)}
                className="relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-sm ring-1 ring-gray-100 transition-transform active:scale-95"
              >
                <img
                  src={isBase64 ? item : getImageUrl(item)}
                  alt={`Галерея ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/10" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Inputs Section */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Дата *</label>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
              <DatePicker2 value={date} setDate={setDate} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Время *</label>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
              <TimePicker value={time} setTime={setTime} placeholder="00:00" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-gray-700">Тип встречи *</label>
          <div
            onClick={() => setIsDrawerOpen(true)}
            className="flex h-12 w-full cursor-pointer items-center justify-between rounded-2xl bg-white px-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition-shadow hover:ring-violet-200 active:scale-[0.99]"
          >
            <span className={!subType && !type ? "text-gray-400" : ""}>
              {subType || type || "Выберите тип"}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-gray-700">Название *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Придумайте название"
            className="h-12 w-full rounded-2xl border-none bg-white px-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-gray-700">Описание *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Расскажите подробнее о встрече..."
            className="min-h-[120px] w-full resize-none rounded-2xl border-none bg-white px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
