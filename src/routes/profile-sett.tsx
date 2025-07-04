import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PlusIcon } from "~/components/Icons/Plus";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/profile-sett")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
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
  }, [user?.name, user?.email, user?.phone, user?.bio]);

  const isDisabled =
    name === user?.name &&
    email === user?.email &&
    phone === user?.phone &&
    bio === user?.bio;

  const updateProfile = useMutation(
    trpc.main.updateProfile.mutationOptions({
      onSuccess: () => {},
    }),
  );

  const handleUpdateProfile = () => {
    updateProfile.mutate({
      email: email || "",
      phone: phone || "",
      bio: bio || "",
    });
    queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
      return {
        ...old,
        email: email,
        phone: phone,
        bio: bio,
      };
    });
  };

  console.log(user?.email);

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
        <div className="h-[82px] w-[82px] rounded-full bg-gray-500"></div>
        <div>Изменить</div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 px-4">
        <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
          <div className="flex flex-col items-start text-sm">
            <div className="text-[#ABABAB]">Имя и фамилия</div>
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
        Сохранить изменения
      </button>
    </div>
  );
}
