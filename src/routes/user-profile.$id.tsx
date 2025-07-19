import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { cn } from "~/lib/utils/cn";
import { getAge } from "~/lib/utils/getAge";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/user-profile/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const queryClient = useQueryClient();
  const { state } = useRouterState({ select: (s) => s.location });
  console.log(state, "state");
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const user = users?.find((user) => user.id === Number(id));

  // Gallery & photo state
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(
    user?.photo || undefined,
  );
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(user?.gallery ?? []);
  const [isClicked, setIsClicked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allPhotos = useMemo(() => {
    return [mainPhoto, ...galleryPhotos].filter(Boolean) as string[];
  }, [mainPhoto, galleryPhotos]);

  // Sync local state when fetched user changes
  useEffect(() => {
    setMainPhoto(user?.photo || undefined);
    setGalleryPhotos(user?.gallery ?? []);
  }, [user]);

  const { data: userSubscriptions } = useQuery(
    trpc.main.getUserSubscriptions.queryOptions(),
  );

  const sendRequest = useMutation(trpc.friends.sendRequest.mutationOptions());
  const unSendRequest = useMutation(trpc.friends.unSendRequest.mutationOptions());
  const { data: userRequests } = useQuery(trpc.main.getMyRequests.queryOptions());

  const isRequest = useMemo(() => {
    return userRequests?.some((f) => f.toUserId === user?.id);
  }, [userRequests, user?.id]);

  const subscribe = useMutation(trpc.main.subscribe.mutationOptions());
  const unsubscribe = useMutation(trpc.main.unSubscribe.mutationOptions());

  const addToFavorites = useMutation(trpc.main.addToFavorites.mutationOptions());
  const removeFromFavorites = useMutation(
    trpc.main.removeFromFavorites.mutationOptions(),
  );
  const { data: userFavorites } = useQuery(trpc.main.getUserFavorites.queryOptions());

  const handleSendRequest = () => {
    if (isRequest) {
      unSendRequest.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
        return old.filter((f: any) => f.toUserId !== user?.id);
      });
    } else {
      sendRequest.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
        return [...(old || []), { fromUserId: user?.id!, toUserId: user?.id! }];
      });
    }
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscriptions.queryKey(), (old: any) => {
        return old.filter((s: any) => s.targetUserId !== user?.id);
      });
    } else {
      subscribe.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscriptions.queryKey(), (old: any) => {
        return [...(old || []), { subscriberId: user?.id!, targetUserId: user?.id! }];
      });
    }
  };

  const isFavorite = useMemo(() => {
    return userFavorites?.some(
      (f) => f.toUserId === user?.id && f.fromUserId === user?.id,
    );
  }, [userFavorites, user?.id]);

  const handleToFavorites = () => {
    if (isFavorite) {
      removeFromFavorites.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return old.filter((f: any) => f.toUserId !== user?.id);
      });
    } else {
      addToFavorites.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return [...(old || []), { fromUserId: user?.id!, toUserId: user?.id! }];
      });
    }
  };

  const isSubscribed = useMemo(() => {
    return userSubscriptions?.some(
      (s) => s.targetUserId === user?.id && s.subscriberId === user?.id,
    );
  }, [userSubscriptions, user?.id]);

  const age = getAge(user?.birthday ?? undefined);

  const isOwner = useMemo(() => {
    return user?.id === user?.id;
  }, [user?.id, user?.id]);

  console.log(isOwner, "isOwner");

  console.log(user?.photoUrl, "mainPhoto");

  return (
    <div className="overflow-y-auto pt-14 pb-10">
      <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4">
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">Профиль</h1>
      </div>
      <div className="relative">
        <div className="relative h-[30vh] rounded-t-2xl">
          <div className="absolute top-5 right-12 left-6 z-10">
            <Maximize2
              className="h-6 w-6 cursor-pointer text-white drop-shadow"
              onClick={() => {
                setCurrentIndex(0);
                setIsFullScreen(true);
              }}
            />
          </div>

          <img
            src={user?.photoUrl ? user?.photoUrl : getImageUrl(user?.photoUrl ?? "")}
            alt={user?.name || ""}
            className="h-full w-full rounded-t-2xl object-cover"
            onClick={() => setIsClicked(!isClicked)}
          />
          {isClicked && (
            <div className="absolute bottom-2 left-4 flex gap-2 overflow-x-auto pt-8">
              {galleryPhotos.map((img, idx) => (
                <img
                  key={idx}
                  src={img.startsWith("data:image/") ? img : getImageUrl(img || "")}
                  alt=""
                  className="h-12 w-12 cursor-pointer rounded-lg object-cover"
                  onClick={() => {
                    setGalleryPhotos((prev) => {
                      const newGallery = prev.filter((i) => i !== img);
                      if (mainPhoto) newGallery.push(mainPhoto);
                      return newGallery;
                    });
                    setMainPhoto(img);
                  }}
                />
              ))}
            </div>
          )}
          <div className="absolute bottom-4 left-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                <span className="text-xl font-bold text-white">1</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
                <div className="rounded bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                  Уровень
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
              onClick={() => handleToFavorites()}
            >
              <Heart className={cn("h-4 w-4 text-black", isFavorite && "text-red-500")} />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">
          {user?.name} {user?.surname}
        </div>
        <div className="text-sm text-gray-500">
          {user?.city}, {age || "не указано"}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-white">
        <div
          className="rounded-2xl bg-[#2462FF] px-4 py-2"
          onClick={() => handleSubscribe()}
        >
          {isSubscribed ? "Отписаться" : "Подписаться"}
        </div>
        <div
          className="rounded-2xl bg-[#9924FF] px-4 py-2"
          onClick={() => handleSendRequest()}
        >
          {isRequest ? "Отменить запрос" : "Добавить в друзья"}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4">
        <div className="text-2xl font-bold">Интересы</div>
        <div className="text-sm text-gray-500">{user?.bio}</div>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4">
        <div className="text-2xl font-bold">Достижения</div>

        <div className="mt-2 flex w-full items-center gap-4 rounded-2xl border border-[#A3FFCD] bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full">
            <img src="/shit.png" alt="achievement" className="h-10 w-10" />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <div className="text-base font-bold text-black">Любитель квестов</div>
            <div className="text-sm text-[#00A349]">Продвинутое</div>
            <div className="rounded-full bg-[#9924FF] px-2 text-white">10/10</div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 pl-4">
        <div className="text-2xl font-bold">Навыки</div>
        <div className="scrollbar-hidden flex w-full gap-3 overflow-x-auto pb-2">
          {[
            {
              title: (
                <>
                  Физические
                  <br />
                  навыки
                </>
              ),
              bg: "#A3FFCD",
              skills: ["Сила", "Выносливость", "Ловкость"],
            },
            {
              title: "Интеллектуальные навыки",
              bg: "#A3BDFF",
              accent: "#002EA3",
              skills: ["Логика", "Память", "Внимание"],
            },
            {
              title: (
                <>
                  Социальные <br />
                  навыки
                </>
              ),
              bg: "#FFD4A3",
              accent: "#A35700",
              skills: ["Коммуникация", "Эмпатия", "Лидерство"],
            },
            {
              title: "Профессиональные умения",
              bg: "#FFA3A3",
              accent: "#A30000",
              skills: ["Экспертиза", "Планирование", "Адаптация"],
            },
          ].map((skill, idx) => (
            <div
              key={idx}
              className="flex shrink-0 flex-col rounded-2xl"
              style={{ background: skill.bg, width: 148, padding: 12 }}
            >
              <div className="text-xs font-bold">{skill.title}</div>

              <div className="mt-2 flex flex-col gap-3">
                {skill.skills.map((skillName, barIdx) => (
                  <div key={barIdx} className="flex flex-col gap-1">
                    <div className="h flex h-6 w-full items-center overflow-hidden rounded-full bg-[#1212121A]">
                      <div
                        className="flex h-full items-center rounded-full"
                        style={{
                          width: `${50 + barIdx * 20}%`,
                          background: "white",
                          transition: "width 0.3s",
                        }}
                      >
                        <div className="px-2 text-xs text-black">{skillName}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex w-full flex-col gap-2 px-4">
        <div className="text-2xl font-bold">Инвентарь</div>
        <div className="flex w-full justify-between gap-2">
          <div className="flex aspect-square h-25 flex-col items-center justify-center rounded-lg">
            <img src="/green-cap.png" alt="coin" className="h-20 w-20" />
            <span className="mt-1 text-sm">Fly Eagle! Fly! </span>
          </div>
          <div className="flex aspect-square h-25 flex-col items-center justify-center rounded-lg">
            <img src="/knife.png" alt="coin" className="h-20 w-20" />
            <span className="mt-1 text-sm">Меч берсер...</span>
          </div>
          <div className="flex aspect-square h-25 flex-col items-center justify-center rounded-lg">
            <img src="/shit.png" alt="coin" className="h-20 w-20" />
            <span className="mt-1 text-sm">Стальной щ...</span>
          </div>
        </div>
      </div>

      {isFullScreen && allPhotos.length > 0 && (
        <div className="bg-opacity-90 fixed inset-0 z-50 flex items-center justify-center bg-black">
          {allPhotos.length > 1 && (
            <ChevronLeft
              className="absolute left-4 h-10 w-10 cursor-pointer text-white"
              onClick={() =>
                setCurrentIndex(
                  (prev) => (prev - 1 + allPhotos.length) % allPhotos.length,
                )
              }
            />
          )}

          {(() => {
            const imgSrc = allPhotos[currentIndex];
            return (
              <img
                src={imgSrc.startsWith("data:image/") ? imgSrc : getImageUrl(imgSrc)}
                alt="Full view"
                className="max-h-full max-w-full object-contain"
              />
            );
          })()}

          {allPhotos.length > 1 && (
            <ChevronRight
              className="absolute right-4 h-10 w-10 cursor-pointer text-white"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % allPhotos.length)}
            />
          )}

          <XIcon
            className="absolute top-4 right-4 h-8 w-8 cursor-pointer text-white"
            onClick={() => setIsFullScreen(false)}
          />
        </div>
      )}
    </div>
  );
}
