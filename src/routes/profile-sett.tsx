import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PlusIcon } from "~/components/Icons/Plus";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { getImageUrl } from "~/lib/utils/getImageURL";
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
  const [phone, setPhone] = useState<string>("");
  const [base64, setBase64] = useState<string | null>(null);
  const [surname, setSurname] = useState<string>("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      setBase64(getImageUrl(user.photo));
    }
    if (user?.gallery) {
      setGallery(user.gallery);
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
    !selectedFile;

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

  console.log(gallery);

  const handleUpdateProfile = () => {
    const filteredGallery = gallery.filter(
      (item) => typeof item === "string" && item.length > 0,
    );
    const photoToSend = base64 && base64.startsWith("data:image/") ? base64 : "";

    updateProfile.mutate({
      email: email || "",
      phone: phone || "",
      bio: bio || "",
      photo: photoToSend,
      gallery: filteredGallery,
      name: name,
      surname: surname || "",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    let fileToProcess: File = file;
    // If file is HEIC, convert to PNG first
    if (file.name.toLowerCase().endsWith(".heic")) {
      fileToProcess = await convertHeicToPng(fileToProcess);
    }
    const base64str = await convertToBase64(fileToProcess);
    setBase64(base64str);
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileToProcess: File = file;

    if (file.name.toLowerCase().endsWith(".heic")) {
      fileToProcess = await convertHeicToPng(fileToProcess);
    }
    const base64str = await convertToBase64(fileToProcess);
    setGallery([...gallery, base64str]);
  };

  console.log(user?.email);

  console.log(gallery);

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="flex items-center justify-between p-4 pb-2">
        <button
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
      <div className="mt-8 mb-4 flex flex-col items-center gap-2">
        <label
          htmlFor="profile-photo-upload"
          className="flex cursor-pointer flex-col items-center"
        >
          <div className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-full bg-gray-300">
            {base64 ? (
              <img
                src={base64}
                alt="Аватар"
                className="h-full w-full rounded-full object-cover"
              />
            ) : user?.photo ? (
              <img
                src={getImageUrl(user.photo || "")}
                alt="Аватар"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#ABABAB" />
                <path
                  d="M20 22c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"
                  fill="#fff"
                />
              </svg>
            )}
          </div>
          <div className="mt-2 text-sm font-medium text-[#9924FF]">
            {user?.photo ? "Изменить" : "Добавить"}
          </div>
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
              className="flex aspect-square w-[21.5%] items-center justify-center rounded-lg bg-[#F3E5FF]"
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
          <div className="flex flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Имя</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Фамилия</div>
            <input
              type="text"
              value={surname || ""}
              onChange={(e) => setSurname(e.target.value)}
              className="border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Email</div>
            <input
              type="text"
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
              className="border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Номер телефона</div>
            <input
              type="text"
              value={phone || ""}
              onChange={(e) => setPhone(e.target.value)}
              className="border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Описание</div>
            <input
              type="text"
              value={bio || ""}
              onChange={(e) => setBio(e.target.value)}
              className="border-none bg-transparent text-black outline-none"
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="text-2xl font-bold">Интересы</div>
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]">
              <PlusIcon />
            </div>
          </div>
        </div>
        <div className="px-4 text-start text-sm text-gray-500">
          У вас пока нет интересов
        </div>
      </div>
      <div className="flex flex-col">
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
      </div>
      <button
        disabled={isDisabled}
        onClick={handleUpdateProfile}
        className={`absolute right-0 bottom-4 left-0 mx-4 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white ${isDisabled && "bg-gray-300"}`}
      >
        {updateProfile.isPending ? "Сохраняем..." : "Сохранить изменения"}
      </button>
    </div>
  );
}
