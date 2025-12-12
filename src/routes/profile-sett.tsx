import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Info, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DatePicker2 from "~/components/DatePicker2";
import { steps } from "~/config/steps";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { isHeicFile } from "~/lib/utils/isHeicFile";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/profile-sett")({
  component: RouteComponent,
});

function InfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Info className="h-6 w-6" />
              </div>

              <h3 className="mb-2 text-xl font-bold text-gray-900">Приватный профиль</h3>

              <div className="space-y-3 text-sm text-gray-600">
                <p>Когда ваш профиль закрыт, другие пользователи видят только:</p>
                <ul className="list-inside list-disc space-y-1 pl-2 font-medium text-gray-900">
                  <li>Ваше фото</li>
                  <li>Имя и возраст</li>
                  <li>Пол</li>
                </ul>
                <p>
                  Вся остальная информация будет скрыта. Чтобы увидеть полный профиль,
                  пользователи должны отправить вам запрос на подписку.
                </p>
              </div>

              <button
                onClick={onClose}
                className="mt-6 w-full rounded-2xl bg-gray-900 py-3.5 font-bold text-white transition-transform active:scale-95"
              >
                Понятно
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const [name, setName] = useState("");

  const [email, setEmail] = useState<string>("");
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [city, setCity] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [base64, setBase64] = useState<string | null>(null);
  const [surname, setSurname] = useState<string>("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mainPhotoRaw, setMainPhotoRaw] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.surname) {
      setSurname(user.surname);
    }
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
    if (user?.bio) {
      setBio(user.bio);
    }
    if (user?.photo) {
      setMainPhotoRaw(user.photo);
      setBase64(getImageUrl(user.photo));
    }
    if (user?.gallery) {
      setGallery(user.gallery);
    }
    if (user?.birthday) {
      // Parse birthday from "dd.mm.yyyy" format to Date object
      const [day, month, year] = user.birthday.split(".");
      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
      setBirthday(parsedDate);
    }
    if (user?.city) {
      setCity(user.city);
    }
    if (user?.isPrivate !== undefined) {
      setIsPrivate(user.isPrivate ?? false);
    }
  }, [
    user?.name,
    user?.surname,
    user?.email,
    user?.phone,
    user?.bio,
    user?.photo,
    user?.gallery,
    user?.birthday,
    user?.city,
    user?.isPrivate,
  ]);

  const isDisabled =
    name === (user?.name ?? "") &&
    surname === (user?.surname ?? "") &&
    email === (user?.email ?? "") &&
    phone === (user?.phone ?? "") &&
    bio === (user?.bio ?? "") &&
    (() => {
      if (!user?.birthday && !birthday) return true;
      if (!user?.birthday || !birthday) return false;
      const [day, month, year] = user.birthday.split(".");
      const userDate = new Date(Number(year), Number(month) - 1, Number(day));
      return birthday.getTime() === userDate.getTime();
    })() &&
    city === (user?.city ?? "") &&
    !selectedFile &&
    gallery.length === (user?.gallery?.length ?? 0) &&
    gallery.every((item, index) => item === user?.gallery?.[index]) &&
    mainPhotoRaw === (user?.photo ?? "") &&
    isPrivate === (user?.isPrivate ?? false);

  const updateProfile = useMutation(
    trpc.main.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.main.getUser.queryKey(),
        });
        toast.success("Профиль сохранен!");
        // Small delay to show success state before navigation
        setTimeout(() => {
          navigate({ to: "/profile" });
        }, 300);
      },
    }),
  );

  const togglePrivate = useMutation(
    trpc.privateProfile.togglePrivateMode.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.main.getUser.queryKey(),
        });
      },
      onError: () => {
        // Revert state on error
        setIsPrivate(user?.isPrivate ?? false);
        toast.error("Не удалось изменить настройки приватности");
      },
    }),
  );

  const deletePhoto = useMutation(
    trpc.main.deletePhoto.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.main.getUser.queryKey(),
        });
      },
    }),
  );

  const handleUpdateProfile = async () => {
    // Prevent double-clicks
    if (updateProfile.isPending || togglePrivate.isPending) return;

    try {
      const filteredGallery = gallery.filter(
        (item) => typeof item === "string" && item.length > 0,
      );
      const photoToSend = mainPhotoRaw;

      // Convert birthday Date to string format dd.mm.yyyy
      if (!birthday) {
        toast.error("Введите дату рождения");
        return;
      }

      const formattedBirthday = birthday.toLocaleDateString("ru-RU");
      const payload = {
        email: email || "",
        phone: phone || "",
        bio: bio || "",
        photo: photoToSend,
        gallery: filteredGallery,
        name: name,
        surname: surname || "",
        birthday: formattedBirthday,
        city: city || "",
      };
      await updateProfile.mutateAsync(payload);

      // Update privacy setting if it changed
      if (isPrivate !== (user?.isPrivate ?? false)) {
        await togglePrivate.mutateAsync({ isPrivate });
      }
    } catch (error: any) {
      toast.error(`❌ Сохранение не удалось: ${error.message || "Неизвестная ошибка"}`);
    }
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
      setBase64(null);
      setMainPhotoRaw("");
      setSelectedFile(null);
    }
  };

  const userSteps = Object.entries(user?.interests || {}).filter(
    ([key, value]) => value,
  ).length;

  const getPercent = () => {
    const totalSteps = steps.length - 1;
    return ((userSteps / totalSteps) * 100).toFixed(0);
  };

  const isMobile = usePlatform();

  return (
    <div data-mobile={isMobile} className="min-h-screen bg-gray-50/50 pb-32">
      {/* Fixed Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        <button
          disabled={updateProfile.isPending}
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-90"
        >
          <ArrowLeft className="h-6 w-6 text-gray-900" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Настройки профиля</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      <div className="space-y-8 px-5 pt-42" data-mobile={isMobile}>
        {/* Main Photo Section */}
        <div className="flex flex-col items-center gap-4">
          <label
            htmlFor="profile-photo-upload"
            className="group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md active:scale-[0.99]"
          >
            {base64 ? (
              <div className="relative w-full">
                <img
                  src={base64}
                  alt="Аватар"
                  className="h-96 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between p-6">
                  <button
                    onClick={handleDeletePhoto}
                    className="rounded-full bg-white/20 p-3 backdrop-blur-md transition-colors hover:bg-white/30 active:scale-90"
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                  <span className="font-medium text-white">Изменить фото</span>
                </div>
              </div>
            ) : (
              <div className="flex h-96 w-full flex-col items-center justify-center bg-gray-50">
                <div className="mb-4 rounded-full bg-violet-100 p-6">
                  <ImagePlus className="h-10 w-10 text-violet-600" />
                </div>
                <span className="text-base font-semibold text-gray-900">
                  Добавить фото
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  Рекомендуемый размер 1080x1080
                </span>
              </div>
            )}
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Private Profile Toggle */}
        <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Скрыть аккаунт</span>
              <button
                onClick={() => setIsInfoOpen(true)}
                className="text-gray-400 transition-colors hover:text-violet-600"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none",
                isPrivate
                  ? "bg-violet-600 shadow-lg shadow-violet-600/30"
                  : "bg-gray-200",
              )}
              role="switch"
              aria-checked={isPrivate}
              aria-label="Toggle private profile"
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out",
                  isPrivate ? "translate-x-5 scale-100" : "translate-x-0.5 scale-100",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-300",
                    isPrivate ? "opacity-0" : "opacity-100",
                  )}
                >
                  <svg
                    className="h-3.5 w-3.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 12 12"
                  >
                    <path
                      d="M4 8l2-2m0 0l2-2M6 6l2-2M6 6L4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-300",
                    isPrivate ? "opacity-100" : "opacity-0",
                  )}
                >
                  <svg
                    className="h-3.5 w-3.5 text-violet-600"
                    fill="currentColor"
                    viewBox="0 0 12 12"
                  >
                    <path d="M9.707 3.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L5 6.586l3.293-3.293a1 1 0 011.414 0z" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Если включено, ваш профиль будет виден только подписчикам
          </p>
        </div>

        {/* Gallery Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Галерея</h2>
          <div className="grid grid-cols-3 gap-3">
            {gallery.map((item, idx) => {
              const isBase64 = typeof item === "string" && item.startsWith("data:image/");
              return (
                <div
                  key={item || idx}
                  onClick={() => handleGalleryClick(item)}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200 transition-transform active:scale-95"
                >
                  <img
                    src={isBase64 ? item : getImageUrl(item)}
                    alt={`Галерея ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              );
            })}

            <label
              htmlFor="gallery-upload"
              className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50 active:scale-95"
            >
              <ImagePlus className="mb-1 h-6 w-6 text-violet-500" />
              <span className="text-[10px] font-medium text-violet-600">Добавить</span>
              <input
                id="gallery-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAddGallery}
              />
            </label>
          </div>
        </div>

        {/* Personal Info Form */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Личная информация</h2>
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-50 p-4">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Имя
              </label>
              <input
                placeholder="Ваше имя"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
            <div className="border-b border-gray-50 p-4">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Фамилия
              </label>
              <input
                placeholder="Ваша фамилия"
                type="text"
                value={surname || ""}
                onChange={(e) => setSurname(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
            <div className="border-b border-gray-50">
              {/* DatePicker usually has its own padding, wrapping it to match style */}
              <div className="p-0">
                <DatePicker2 value={birthday} setDate={setBirthday} />
              </div>
            </div>
            <div className="p-4">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Город
              </label>
              <input
                placeholder="Ваш город"
                type="text"
                value={city || ""}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Контакты</h2>
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="border-b border-gray-50 p-4">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Email
              </label>
              <input
                placeholder="example@mail.com"
                type="text"
                value={email || ""}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
            <div className="p-4">
              <label className="text-xs font-medium tracking-wider text-gray-500 uppercase">
                Телефон
              </label>
              <input
                placeholder="+7 000 000 00 00"
                type="text"
                value={phone || ""}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full bg-transparent text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Обо мне</h2>
          <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <textarea
              placeholder="Расскажите немного о себе..."
              value={bio || ""}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full resize-none bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center p-2">
            <div className="flex-1 rounded-2xl bg-violet-50 p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-violet-900">Заполненность профиля</span>
                  <span className="text-violet-700">{getPercent()}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
                  <div
                    className="h-full rounded-full bg-violet-600"
                    style={{ width: `${getPercent()}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                navigate({
                  to: "/fill-profile",
                  search: { isSettingsSearch: getPercent() === "100" ? "true" : "false" },
                })
              }
              className="ml-2 flex h-full items-center justify-center rounded-2xl bg-gray-900 px-6 py-4 font-medium text-white transition-colors transition-transform hover:bg-gray-800 active:scale-95"
            >
              {getPercent() === "100" ? "Изменить" : "Заполнить"}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Save Button */}
      <div className="pb-safe fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white/95 p-4 backdrop-blur-sm">
        <button
          disabled={isDisabled || updateProfile.isPending || togglePrivate.isPending}
          onClick={handleUpdateProfile}
          className={cn(
            "relative w-full overflow-hidden rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-all duration-300 ease-in-out",
            isDisabled || updateProfile.isPending || togglePrivate.isPending
              ? "cursor-not-allowed bg-gray-200 text-gray-400 shadow-none"
              : "bg-gray-900 shadow-gray-200/50 hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-200/30 active:scale-[0.98]",
          )}
        >
          <span className="relative inline-block">
            <span
              className={cn(
                "transition-opacity duration-300",
                (updateProfile.isPending || togglePrivate.isPending) && "opacity-0",
              )}
            >
              Сохранить изменения
            </span>
            {(updateProfile.isPending || togglePrivate.isPending) && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            )}
          </span>
        </button>
      </div>

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
}
