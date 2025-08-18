import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import FilterDrawer from "~/components/FilterDrawer";
import { FullScreenPhoto } from "~/components/FullScreenPhoto";
import { Header } from "~/components/Header";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import PeopleDrawer from "~/components/PeopleDrawer";
import { User } from "~/db/schema";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import {
  calculateDistanceFromCoords,
  formatDistance,
} from "~/lib/utils/calculateDistance";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getAge } from "~/lib/utils/getAge";
import { getImage } from "~/lib/utils/getImage";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/people")({
  component: RouteComponent,
});

function RouteComponent() {
  // Restore saved scroll position (if any) when returning to the list
  useScrollRestoration("people");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const isMobile = usePlatform();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState("");
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const [galleryPhotosByUserId, setGalleryPhotosByUserId] = useState<
    Record<number, string[]>
  >({});

  const [currentIndexByUserId, setCurrentIndexByUserId] = useState<
    Record<number, number>
  >({});

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenPhotos, setFullScreenPhotos] = useState<string[]>([]);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  const touchStartXRef = useRef<Record<number, number>>({});
  const touchEndXRef = useRef<Record<number, number>>({});
  const didSwipeRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (users) {
      setGalleryPhotosByUserId(
        users.reduce(
          (acc, u) => {
            acc[u.id] = u.gallery || [];
            return acc;
          },
          {} as Record<number, string[]>,
        ),
      );
      setCurrentIndexByUserId(
        users.reduce(
          (acc, u) => {
            acc[u.id] = 0;
            return acc;
          },
          {} as Record<number, number>,
        ),
      );
    }
  }, [users]);

  useEffect(() => {
    if (users) {
      setSelectedMainPhotoByUserId(
        users.reduce(
          (acc, u) => {
            acc[u.id] = u.photo || "";
            return acc;
          },
          {} as Record<number, string>,
        ),
      );
    }
  }, [users]);

  const [selectedMainPhotoByUserId, setSelectedMainPhotoByUserId] = useState<
    Record<number, string | undefined>
  >({});

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const filteredUsers = useMemo(() => {
    return users?.filter((u) => {
      if (user?.notInterestedIds?.includes(u.id)) {
        return false;
      }
      return (
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.surname?.toLowerCase().includes(search.toLowerCase()) ||
        u.login?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [users, user, search]);

  const usersWithDistances = useMemo(() => {
    if (!user?.coordinates || !filteredUsers) {
      return filteredUsers?.map((u) => ({ ...u, distance: null })) || [];
    }

    return filteredUsers.map((u) => {
      if (!u.coordinates) {
        return { ...u, distance: null };
      }

      const distance = calculateDistanceFromCoords(
        user.coordinates as [number, number],
        u.coordinates,
      );
      return { ...u, distance };
    });
  }, [filteredUsers, user?.coordinates]);

  // Сортируем по расстоянию (ближайшие первыми)
  const sortedUsers = useMemo(() => {
    return [...usersWithDistances].sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [usersWithDistances]);

  const hideUser = useMutation(trpc.main.hideUser.mutationOptions());

  const handleHideUser = (userId: number) => {
    hideUser.mutate({ userId });

    setIsDrawerOpen(false);

    if (user?.notInterestedIds?.includes(userId)) {
      queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
        return {
          ...old,
          notInterestedIds: old?.notInterestedIds?.filter((id: number) => id !== userId),
        };
      });
    } else {
      queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
        return {
          ...old,
          notInterestedIds: [...(old?.notInterestedIds || []), userId],
        };
      });
    }
  };

  const { data: userFavorites } = useQuery(trpc.main.getUserFavorites.queryOptions());
  const addToFavorites = useMutation(trpc.main.addToFavorites.mutationOptions());
  const removeFromFavorites = useMutation(
    trpc.main.removeFromFavorites.mutationOptions(),
  );

  const isFavorite = useMemo(
    () => (favUserId: number) => userFavorites?.some((f) => f.toUserId === favUserId),
    [userFavorites],
  );

  const handleToFavorites = (favUserId: number) => {
    if (isFavorite(favUserId)) {
      removeFromFavorites.mutate({ userId: favUserId, type: "user" });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return old.filter(
          (f: any) => f.toUserId !== favUserId && f.fromUserId !== user?.id,
        );
      });
    } else {
      addToFavorites.mutate({ userId: favUserId, type: "user" });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return [
          ...(old || []),
          { fromUserId: user?.id!, toUserId: favUserId, type: "user" },
        ];
      });
    }
  };

  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());

  const submitComplaint = (complaint: string, type: "event" | "user") => {
    if (!selectedUser) return;
    sendComplaint.mutate({
      complaint,
      type,
      toUserId: selectedUser as number,
    });
    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return [
        ...(old || []),
        { type, toUserId: selectedUser as number, complaint, fromUserId: user?.id! },
      ];
    });
  };

  const openComplaintDrawer = () => {
    if (isComplained) {
      handleUnsendComplaint("user", selectedUser as number);
    } else {
      setIsComplaintOpen(true);
      setIsDrawerOpen(false);
    }
  };

  const unsendComplaint = useMutation(trpc.main.unsendComplaint.mutationOptions());
  const handleUnsendComplaint = (type: "event" | "user", userId: number) => {
    if (!selectedUser) return;
    unsendComplaint.mutate({
      toUserId: userId,
      type,
    });
    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return old.filter(
        (c: any) => c.toUserId !== selectedUser && c.fromUserId !== user?.id,
      );
    });
  };

  const saveUser = useMutation(trpc.main.saveUser.mutationOptions());

  const handleSaveUser = (userId: number) => {
    saveUser.mutate({ userId });

    if (user?.savedIds?.includes(userId)) {
      queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
        return {
          ...old,
          savedIds: old?.savedIds?.filter((id: number) => id !== userId),
        };
      });
    } else {
      queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
        return {
          ...old,
          savedIds: [...(old?.savedIds || []), userId],
        };
      });
    }
  };

  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());

  const isComplained = useMemo(() => {
    return complaints?.some((c) => c.type === "user" && c.toUserId === selectedUser);
  }, [complaints, selectedUser]);

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-14 pb-24 data-[mobile=true]:pt-39"
    >
      <Header />

      <div className="flex items-center justify-between px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Люди</h1>
      </div>

      <div className="mb-4 flex items-center justify-center gap-6 px-4">
        <input
          type="text"
          placeholder="Поиск людей"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />

        <FilterDrawer
          open={isOpen}
          onOpenChange={(open) => {
            if (open) {
              lockBodyScroll();
            } else {
              unlockBodyScroll();
            }
            setIsOpen(open);
          }}
        >
          <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
            <WhiteFilter />
          </div>
        </FilterDrawer>
      </div>

      <div className="flex flex-col gap-8">
        {sortedUsers?.map((u) => (
          <div key={u.id}>
            <div className="flex flex-col items-start justify-center">
              {(() => {
                const allPhotos = [
                  selectedMainPhotoByUserId[u.id] ?? "",
                  ...(galleryPhotosByUserId[u.id] ?? []),
                ].filter(Boolean);
                const currentIndex = currentIndexByUserId[u.id] ?? 0;
                const currentPhoto = allPhotos[currentIndex] ?? "";
                const handleSwipe = (direction: "left" | "right") => {
                  if (allPhotos.length <= 1) return;
                  const len = allPhotos.length;
                  const nextIndex =
                    direction === "left"
                      ? (currentIndex + 1) % len
                      : (currentIndex - 1 + len) % len;
                  setCurrentIndexByUserId((prev) => ({ ...prev, [u.id]: nextIndex }));
                };
                return (
                  <div
                    className="relative w-full"
                    onTouchStart={(e) => {
                      touchStartXRef.current[u.id] = e.touches[0].clientX;
                      touchEndXRef.current[u.id] = e.touches[0].clientX;
                      didSwipeRef.current[u.id] = false;
                    }}
                    onTouchMove={(e) => {
                      touchEndXRef.current[u.id] = e.touches[0].clientX;
                    }}
                    onTouchEnd={() => {
                      const startX = touchStartXRef.current[u.id] ?? 0;
                      const endX = touchEndXRef.current[u.id] ?? 0;
                      const deltaX = endX - startX;
                      if (Math.abs(deltaX) > 50) {
                        didSwipeRef.current[u.id] = true;
                        if (deltaX < 0) handleSwipe("left");
                        else handleSwipe("right");
                        // Prevent immediate click after swipe
                        setTimeout(() => {
                          didSwipeRef.current[u.id] = false;
                        }, 0);
                      }
                    }}
                    onClick={() => {
                      if (didSwipeRef.current[u.id]) return;
                      if (allPhotos.length === 0) return;
                      setFullScreenPhotos(allPhotos);
                      setFullScreenIndex(currentIndex);
                      setIsFullScreen(true);
                    }}
                  >
                    <div className="h-60 w-full overflow-hidden rounded-lg">
                      <AnimatePresence initial={false}>
                        <motion.img
                          key={currentIndex}
                          src={getImage(u as any, currentPhoto)}
                          alt={u.name || ""}
                          className="h-60 w-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                        />
                      </AnimatePresence>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(u.id);
                        setIsDrawerOpen(true);
                      }}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F0FF] p-2"
                    >
                      <div className="pb-2 text-sm font-bold text-[#721DBD]">...</div>
                    </div>
                    {allPhotos.length > 1 && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        {allPhotos.map((_, idx) => (
                          <span
                            key={idx}
                            className={
                              "h-2 w-2 rounded-full " +
                              (idx === currentIndex ? "bg-[#9924FF]" : "bg-white/70")
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: u.id.toString() },
                  });
                  saveScrollPosition("people");
                }}
                className="w-full cursor-pointer"
              >
                <div className="flex w-full items-center justify-between px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="relative flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                        <span className="text-xl font-bold text-white">1</span>
                      </div>
                    </div>
                    <div className="font-bold text-nowrap">
                      {u.name} {u.surname}
                    </div>
                  </div>

                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToFavorites(u.id);
                    }}
                  >
                    <Heart
                      className={cn(
                        "h-6 w-6 text-black",
                        isFavorite(u.id) && "text-red-500",
                      )}
                    />
                  </button>
                </div>
                <div className="flex w-full items-center justify-between px-4 pb-4">
                  <div className="text-sm text-neutral-500">
                    г. {u?.city}, {getAge(u?.birthday) || "не указано"}
                  </div>
                  <div className="flex items-center gap-2">
                    {u.distance !== null && (
                      <span className="text-sm font-medium text-blue-600">
                        {formatDistance(u.distance)}
                      </span>
                    )}
                    <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">
                      Рейтинг 4.5
                    </div>
                  </div>
                </div>
                <div className="px-4">
                  <div className="text-sm">
                    {u.bio?.length && u.bio?.length > 100
                      ? u.bio?.slice(0, 100) + "..."
                      : u.bio || "не указано"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <PeopleDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        userId={selectedUser as number}
        onComplain={() => {
          openComplaintDrawer();
        }}
        onSave={() => {
          handleSaveUser(selectedUser as number);
        }}
        onHide={handleHideUser}
        user={user as User}
        isComplained={isComplained || false}
      />
      {isFullScreen && fullScreenPhotos.length > 0 && (
        <FullScreenPhoto
          allPhotos={fullScreenPhotos}
          currentIndex={fullScreenIndex}
          setCurrentIndex={setFullScreenIndex}
          setIsFullScreen={setIsFullScreen}
        />
      )}
      {isComplaintOpen && (
        <ComplaintDrawer
          handleSendComplaint={() => submitComplaint(complaint, "user")}
          complaint={complaint}
          setComplaint={setComplaint}
          open={isComplaintOpen}
          onOpenChange={setIsComplaintOpen}
          userId={selectedUser as number}
          type="user"
          isComplained={isComplained || false}
        />
      )}
    </div>
  );
}
