import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  History,
  Package,
  Settings,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { MenuItem } from "~/components/MenuItem";
import { fakeUsers } from "~/config/fakeUsers";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/user-profile/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { state } = useRouterState({ select: (s) => s.location });
  console.log(state, "state");
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  // add when it will be real data
  // const { data: user } = useQuery(trpc.main.getUserById.queryOptions({ id }));
  const user = fakeUsers.find((user) => user.id === Number(id));
  const { data: activeEvents } = useQuery(trpc.event.getMyEvents.queryOptions());

  const [isClicked, setIsClicked] = useState(false);

  useScroll();

  const activeQuests = useMemo(() => {
    return activeEvents?.filter((event) => event.name === "Квест");
  }, [activeEvents]);

  const userAge = user?.birthday
    ? new Date().getFullYear() - new Date(user.birthday).getFullYear()
    : new Date().getFullYear() - new Date().getFullYear();

  console.log(user?.photo, "user?.photo");

  console.log(user?.name, "user?.name");

  return (
    <div className="min-h-screen overflow-y-auto bg-white pb-20">
      <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-white p-4">
        <button
          onClick={() => window.history.back()}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-center text-base font-bold text-gray-800">Профиль</h1>
        </div>
        <div className="w-6" />
      </div>
      <div className="px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
      </div>

      <div className="relative">
        <div className="relative h-60">
          {/* Level Badge */}
          <img
            src={
              user?.photo?.startsWith("data:image/")
                ? user?.photo
                : getImageUrl(user?.photo || "")
            }
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onClick={() => setIsClicked(!isClicked)}
          />
          {isClicked && (
            <>
              <div className="absolute bottom-2 left-2 flex items-center">
                <div className="relative flex items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
                    <div className="rounded-lg bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                      Уровень
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex gap-2 pt-8">
                  {user?.gallery?.map((img, idx) => (
                    <img
                      key={idx}
                      src={img?.startsWith("data:image/") ? img : getImageUrl(img || "")}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
              <div className="absolute top-4 left-4 flex items-center justify-center gap-2 rounded-md bg-[#FFD943] px-2 py-1">
                <div className="font-medium text-black">Пройти верификацию</div>
                <ArrowRight className="h-4 w-4 text-black" />
              </div>

              {/* Edit Button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => navigate({ to: "/profile-sett" })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
                >
                  <Settings className="h-4 w-4 text-black" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4">
        <div className="text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-black">
              {user?.name} {user?.surname}
            </h2>
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-blue-500 text-blue-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            г. {user?.city}, {userAge} лет
          </p>
        </div>
      </div>

      {/* Digital Avatar Card */}
      {/* <div className="mx-4 mb-4">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-5">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-purple-600" />
                <span className="text-base font-medium text-black">Цифровой аватар</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div> */}

      <div className="mt-4 mb-6 px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-yellow-400 p-3 shadow-sm">
            <div className="mb-1 text-center text-xl font-bold text-black">
              {activeQuests?.length || 0}
            </div>
            <div
              onClick={() => {
                navigate({ to: "/user-quests/$page", params: { page: "active" } });
              }}
              className="flex items-center justify-center gap-1"
            >
              <div className="flex h-4 w-4 items-center justify-center rounded bg-[#FFF2BD]">
                !
              </div>
              <span className="text-sm text-black">Квесты</span>
            </div>
          </div>
          <div className="rounded-xl bg-purple-600 p-3 shadow-sm">
            <div className="mb-1 text-center text-xl font-bold text-white">
              {user?.balance || 0}
            </div>
            <div
              onClick={() => {
                navigate({ to: "/points" });
              }}
              className="flex items-center justify-center gap-1"
            >
              <Coin />
              <span className="text-sm text-white">Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interests Section */}
      <div className="mx-4">
        <div className="flex flex-col items-start justify-between py-3">
          <h3 className="text-xl font-bold text-black">Обо мне</h3>
          {user?.bio ? (
            <div className="text-sm text-black">{user.bio}</div>
          ) : (
            <div className="text-sm text-black">
              Расскажите о себе, чтобы другие пользователи могли узнать вас
            </div>
          )}
        </div>
      </div>
      <div className="mx-4">
        <div className="flex flex-col items-start justify-between py-3">
          <h3 className="text-xl font-bold text-black">Интересы</h3>
          {user?.interests ? (
            <div className="text-sm text-black">{user.interests}</div>
          ) : (
            <div className="text-sm text-black">
              Расскажите о себе, чтобы другие пользователи могли узнать вас
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="mb-6">
        <div className="space-y-0">
          <MenuItem
            onClick={() => {
              navigate({ to: "/skills" });
              console.log("clicked");
            }}
            icon={<BarChart3 className="h-6 w-6 text-purple-300" />}
            title="Ваши навыки"
          />
          <MenuItem
            onClick={() => {
              navigate({ to: "/achievments" });
            }}
            icon={<Award className="h-6 w-6 text-purple-300" />}
            title="Достижения"
          />
          <MenuItem
            onClick={() => {
              navigate({ to: "/calendar" });
            }}
            icon={<Calendar className="h-6 w-6 text-purple-300" />}
            title="Календарь"
          />
          <MenuItem
            onClick={() => {
              navigate({ to: "/history" });
            }}
            icon={<History className="h-6 w-6 text-purple-300" />}
            title="История"
          />
          <MenuItem
            onClick={() => {
              navigate({ to: "/inventory" });
            }}
            icon={<Package className="h-6 w-6 text-purple-300" />}
            title="Инвентарь"
          />
        </div>
      </div>
    </div>
  );
}
