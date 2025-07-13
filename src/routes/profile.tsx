import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  History,
  Package,
  Search,
  Settings,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { MenuItem } from "~/components/MenuItem";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [page, setPage] = useState<"info" | "friends">("info");
  const { data: activeEvents } = useQuery(trpc.event.getMyEvents.queryOptions());
  const [isClicked, setIsClicked] = useState(false);
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: requests } = useQuery(trpc.friends.getRequests.queryOptions());

  console.log(requests, "requests");

  const activeQuests = useMemo(() => {
    return activeEvents?.filter((event) => event.type === "Квест") || [];
  }, [activeEvents]);

  const userAge = user?.birthday
    ? new Date().getFullYear() - new Date(user.birthday).getFullYear()
    : new Date().getFullYear() - new Date().getFullYear();

  const acceptRequest = useMutation(trpc.friends.acceptRequest.mutationOptions());
  const declineRequest = useMutation(trpc.friends.declineRequest.mutationOptions());

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-12 pb-20">
      <Header />

      <div className="px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
      </div>

      <div className="flex gap-4 px-4 pb-4">
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            page === "info" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("info")}
        >
          Информация
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            page === "friends" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("friends")}
        >
          Друзья
        </button>
      </div>

      {page === "info" && (
        <>
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
                          src={
                            img?.startsWith("data:image/") ? img : getImageUrl(img || "")
                          }
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

          <div className="flex w-full items-center justify-start gap-1 px-4">
            <div className="flex h-14 flex-1 flex-col justify-center rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-nowrap">Заполенность профиля 0%</div>
                <div className="h-2 w-full rounded-full bg-white"></div>
              </div>
            </div>
            <div
              className="flex h-14 cursor-pointer items-center justify-center rounded-sm rounded-br-2xl bg-[#9924FF] px-4 py-2"
              onClick={() => navigate({ to: "/fill-profile" })}
            >
              <div className="text-white">Заполнить</div>
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
                    navigate({ to: "/user-quests" });
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
        </>
      )}

      {page === "friends" && (
        <>
          <div className="relative px-4 py-4">
            <input
              type="text"
              placeholder="Поиск друзей"
              className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
            <div className="absolute top-7 right-7">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            {requests && requests?.length > 0 && (
              <div className="flex flex-col gap-2">
                <div>Запросы</div>
                <div>
                  {requests?.map((request) => (
                    <div
                      key={request.id}
                      className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="mb-2 font-medium text-black">
                        {request.fromUserId}
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-green-500 px-3 py-1 text-white transition hover:bg-green-600"
                          onClick={() =>
                            acceptRequest.mutate({ userId: request.fromUserId! })
                          }
                        >
                          Принять
                        </button>
                        <button
                          className="rounded bg-red-500 px-3 py-1 text-white transition hover:bg-red-600"
                          onClick={() =>
                            declineRequest.mutate({ userId: request.fromUserId! })
                          }
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>{friends?.length || 0} друзей</div>
          </div>
        </>
      )}
    </div>
  );
}
