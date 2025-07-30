import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AddPhoto } from "~/components/Icons/AddPhoto";
import { PlusIcon } from "~/components/Icons/Plus";
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
  const [birthday, setBirthday] = useState<string>("");
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
      // при загрузке конвертируем числовой месяц в название
      const [day, monthStr, year] = user.birthday.split(".");
      const monthNames = [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
      ];
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthName = monthNames[monthIndex] || monthStr || "";
      setBirthday(`${day}.${monthName}.${year}`);
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
  ]);

  const isDisabled =
    name === (user?.name ?? "") &&
    surname === (user?.surname ?? "") &&
    email === (user?.email ?? "") &&
    phone === (user?.phone ?? "") &&
    bio === (user?.bio ?? "") &&
    (() => {
      if (!user?.birthday) return birthday === "";

      // Convert user's numeric birthday to month name format for comparison with current state
      const [userDay, userMonthStr, userYear] = user.birthday.split(".");
      const monthNames = [
        "Январь",
        "Февраль",
        "Март",
        "Апрель",
        "Май",
        "Июнь",
        "Июль",
        "Август",
        "Сентябрь",
        "Октябрь",
        "Ноябрь",
        "Декабрь",
      ];
      const userMonthIndex = parseInt(userMonthStr, 10) - 1;
      const userMonthName = monthNames[userMonthIndex] || userMonthStr || "";
      const userBirthdayWithMonthName = `${userDay}.${userMonthName}.${userYear}`;

      return birthday === userBirthdayWithMonthName;
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

  // month dropdown data and placeholder control
  const monthOptions = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];
  const monthValue = birthday.split(".")[1] || "";
  const filteredMonths =
    monthValue.length > 0
      ? monthOptions.filter((m) => m.toLowerCase().includes(monthValue.toLowerCase()))
      : [];
  const isBirthdayEmpty = birthday.split(".").every((p) => !p);

  const handleUpdateProfile = async () => {
    try {
      const filteredGallery = gallery.filter(
        (item) => typeof item === "string" && item.length > 0,
      );
      const photoToSend = mainPhotoRaw;

      // Format birthday as dd.MM.yyyy
      const parts = birthday.split(".");
      const dayStr = parts[0]?.padStart(2, "0") || "";
      const monthInput = parts[1] || "";
      let monthNumber;
      if (/^\d+$/.test(monthInput)) {
        monthNumber = monthInput.padStart(2, "0");
      } else {
        const idx = monthOptions.indexOf(monthInput);
        monthNumber = idx >= 0 ? String(idx + 1).padStart(2, "0") : monthInput;
      }
      const yearStr = parts[2] || "";

      // Проверка правильности формата даты
      if (!dayStr || !monthNumber || !yearStr) {
        toast.error("Некорректная дата рождения");
        return;
      }

      const formattedBirthday = `${dayStr}.${monthNumber}.${yearStr}`;
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

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="flex items-center justify-between p-4 pb-2">
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
          className="flex w-full cursor-pointer flex-col items-center gap-2"
        >
          {base64 ? (
            <div className="relative">
              <img
                src={base64}
                alt="Аватар"
                className="mb-2 h-60 w-[92vw] rounded-2xl object-cover"
              />
              <div className="absolute right-0 bottom-2 flex w-full items-center justify-center gap-20 rounded-b-2xl bg-[#12121280] px-4 py-2 text-white">
                <div className="z-[10000]" onClick={handleDeletePhoto}>
                  Удалить
                </div>
                <div>Изменить</div>
              </div>
            </div>
          ) : (
            <div className="mb-2 flex h-40 w-[92vw] items-center justify-center rounded-2xl bg-[#F0F0F0]">
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
        <div className="relative flex w-full gap-2">
          <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
            <div className="flex w-full flex-col items-start text-sm">
              <div className="text-[#ABABAB]">День</div>
              <input
                type="number"
                value={birthday ? birthday.split(".")[0] || "" : ""}
                onChange={(e) => {
                  const day = e.target.value;
                  const parts = birthday ? birthday.split(".") : ["", "", ""];
                  setBirthday(`${day}.${parts[1] || ""}.${parts[2] || ""}`);
                }}
                className="w-full border-none bg-transparent text-black outline-none"
              />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
            <div className="relative w-full">
              <div className="text-[#ABABAB]">Месяц</div>
              <input
                type="text"
                value={monthValue}
                onClick={() => {
                  if (monthValue) {
                    const [d, , y] = birthday.split(".");
                    setBirthday(`${d || ""}.${""}.${y || ""}`);
                  }
                }}
                onChange={(e) => {
                  const m = e.target.value;
                  const [d, , y] = birthday.split(".");
                  setBirthday(`${d || ""}.${m}.${y || ""}`);
                }}
                className="w-full border-none bg-transparent text-black outline-none"
              />
              {filteredMonths.length > 0 && !monthOptions.includes(monthValue) && (
                <ul className="absolute top-full right-0 z-10 mt-1 max-h-40 w-[100px] overflow-auto rounded-lg border bg-white shadow-lg">
                  {filteredMonths.map((m) => (
                    <li
                      key={m}
                      onClick={() => {
                        const [d, , y] = birthday.split(".");
                        setBirthday(`${d || ""}.${m}.${y || ""}`);
                      }}
                      className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
            <div className="flex w-full flex-col items-start text-sm">
              <div className="text-[#ABABAB]">Год</div>
              <input
                type="number"
                value={birthday ? birthday.split(".")[2] || "" : ""}
                onChange={(e) => {
                  const year = e.target.value;
                  const parts = birthday ? birthday.split(".") : ["", "", ""];
                  setBirthday(`${parts[0] || ""}.${parts[1] || ""}.${year}`);
                }}
                className="w-full border-none bg-transparent text-black outline-none"
              />
            </div>
          </div>
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
      <div className="flex flex-col px-4">
        <div className="flex items-center justify-between py-4">
          <div className="text-2xl font-bold">О себе</div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex w-full flex-col items-start text-sm">
            <div className="text-[#ABABAB]">О себе</div>
            <input
              placeholder="Введите описание"
              type="text"
              value={bio || ""}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border-none bg-transparent text-black outline-none"
            />
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
