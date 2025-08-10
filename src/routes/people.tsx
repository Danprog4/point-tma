import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import PeopleDrawer from "~/components/PeopleDrawer";
import { User } from "~/db/schema";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
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
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

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
        {filteredUsers?.map((u) => (
          <div key={u.id}>
            <div className="flex flex-col items-start justify-center">
              <div className="relative w-full">
                <img
                  src={getImage(u as any, "")}
                  alt={u.name || ""}
                  className="h-60 w-full rounded-lg object-cover"
                  onClick={() => {
                    saveScrollPosition("people");
                    navigate({
                      to: "/user-profile/$id",
                      params: { id: u.id.toString() },
                    });
                  }}
                />
                <div
                  onClick={() => {
                    setSelectedUser(u.id);
                    setIsDrawerOpen(true);
                  }}
                  className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#F8F0FF] p-2"
                >
                  <div className="pb-2 text-sm font-bold text-[#721DBD]">...</div>
                </div>
              </div>

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
                <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">Рейтинг 4.5</div>
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
        ))}
      </div>
      <PeopleDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        userId={selectedUser as number}
        onComplain={() => {}}
        onSave={() => {}}
        onHide={handleHideUser}
        user={user as User}
      />
    </div>
  );
}
