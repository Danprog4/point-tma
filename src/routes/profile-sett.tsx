import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import DatePicker2 from "~/components/DatePicker2";
import { AddPhoto } from "~/components/Icons/AddPhoto";
import { PlusIcon } from "~/components/Icons/Plus";
import { steps } from "~/config/steps";
import { usePlatform } from "~/hooks/usePlatform";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { isHeicFile } from "~/lib/utils/isHeicFile";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/profile-sett")({
  component: RouteComponent,
});

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
    mainPhotoRaw === (user?.photo ?? "");

  const updateProfile = useMutation(
    trpc.main.updateProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.main.getUser.queryKey(),
        });
        navigate({ to: "/profile" });
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
      toast.success("✅ Профиль сохранен!");
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
    <div
      data-mobile={isMobile}
      className="h-full overflow-y-auto pb-24 data-[mobile=true]:pt-32"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          disabled={updateProfile.isPending}
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-center text-base font-bold text-gray-800">
            Настройки профиля
          </h1>
        </div>
      </div>
      <div className="mt-8 flex w-full flex-col items-center gap-4">
        <label
          htmlFor="profile-photo-upload"
          className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-t-2xl"
        >
          {base64 ? (
            <div className="relative w-full rounded-t-2xl">
              <img
                src={base64}
                alt="Аватар"
                className="mb-2 h-90 w-full rounded-t-2xl object-cover"
              />
              <div className="absolute right-0 bottom-2 flex w-full items-center justify-center gap-20 bg-[#12121280] px-4 py-2 text-white">
                <div className="z-[10000]" onClick={handleDeletePhoto}>
                  Удалить
                </div>
                <div>Изменить</div>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex h-90 w-full items-center justify-center rounded-t-2xl bg-[#F0F0F0]">
              <div className="flex flex-col items-center gap-2">
                <AddPhoto />
                <div className="text-sm text-[#9924FF]">Загрузить фото профиля</div>
              </div>
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
      <div className="mb-4 px-4 text-2xl font-bold">Галерея</div>
      <div className="mb-4 flex flex-wrap gap-4 px-4">
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
      <div className="flex flex-col items-center justify-center gap-4 px-4">
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Имя</div>
            <input
              placeholder="Введите имя"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Фамилия</div>
            <input
              placeholder="Введите фамилию"
              type="text"
              value={surname || ""}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="w-full">
          <DatePicker2 value={birthday} setDate={setBirthday} />
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Город</div>
            <input
              placeholder="Введите город"
              type="text"
              value={city || ""}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Email</div>
            <input
              placeholder="example@mail.com"
              type="text"
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Номер телефона</div>
            <input
              placeholder="+7 000 000 00 00"
              type="text"
              value={phone || ""}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col px-4 py-4">
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Обо мне</div>
            <textarea
              placeholder="Введите описание"
              value={bio || ""}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-start gap-1 px-4">
        <div className="flex h-14 flex-1 flex-col justify-center rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-nowrap">
              Заполенность профиля {getPercent()}%
            </div>
            <div className="h-2 w-full rounded-full bg-white">
              <div
                className="h-2 rounded-full bg-[#9924FF]"
                style={{ width: `${getPercent()}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div
          className="flex h-14 cursor-pointer items-center justify-center rounded-sm rounded-br-2xl bg-[#9924FF] px-4 py-2"
          onClick={() =>
            navigate({
              to: "/fill-profile",
              search: { isSettingsSearch: getPercent() === "100" ? "true" : "false" },
            })
          }
        >
          <div className="text-white">
            {getPercent() === "100" ? "Изменить" : "Заполнить"}
          </div>
        </div>
      </div>
      {/* <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-2xl font-bold">Социальные сети</div>
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]">
              <PlusIcon />
            </div>
          </div>
        </div>
        <div className="px-4 text-start text-sm text-gray-500">
          У вас пока нет социальных сетей
        </div>
      </div> */}
      <button
        disabled={isDisabled}
        onClick={handleUpdateProfile}
        className={`fixed right-0 bottom-4 left-0 mx-4 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white ${isDisabled && "bg-gray-300"}`}
      >
        {updateProfile.isPending ? "Сохраняем..." : "Сохранить изменения"}
      </button>
    </div>
  );
}
