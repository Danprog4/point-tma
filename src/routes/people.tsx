import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getAge } from "~/lib/utils/getAge";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/people")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const isMobile = usePlatform();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  const filteredUsers = users?.filter((user) => {
    return (
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.surname?.toLowerCase().includes(search.toLowerCase()) ||
      user.login?.toLowerCase().includes(search.toLowerCase())
    );
  });

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

      <div className="flex flex-col gap-4">
        {filteredUsers?.map((user) => (
          <div key={user.id}>
            <div className="flex flex-col items-start justify-center">
              <img
                src={user.photo ? getImageUrl(user.photo) : user.photoUrl || ""}
                alt={user.name || ""}
                className="h-60 w-full rounded-lg object-cover"
              />
              <div className="flex w-full items-center justify-between px-4 py-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="relative flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                      <span className="text-xl font-bold text-white">1</span>
                    </div>
                  </div>
                  <div className="font-bold text-nowrap">
                    {user.name} {user.surname}
                  </div>
                </div>

                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    // handleToFavorites();
                  }}
                >
                  <Heart className={cn("h-6 w-6 text-black", true && "text-red-500")} />
                </button>
              </div>
              <div className="flex w-full items-center justify-between px-4 pb-4">
                <div className="text-sm text-neutral-500">
                  г. {user?.city}, {getAge(user?.birthday) || "не указано"}
                </div>
                <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">Рейтинг 4.5</div>
              </div>
              <div className="px-4">
                <div className="text-sm">
                  {user.bio?.length && user.bio?.length > 100
                    ? user.bio?.slice(0, 100) + "..."
                    : user.bio || "не указано"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
