import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { List, Map } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import { FullScreenPhoto } from "~/components/FullScreenPhoto";
import { Header } from "~/components/Header";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { PeopleHeader } from "~/components/people/PeopleHeader";
import { PeopleMap } from "~/components/people/PeopleMap";
import { UsersList } from "~/components/people/UsersList";
import PeopleDrawer from "~/components/PeopleDrawer";
import { User } from "~/db/schema";
import { usePeopleActions } from "~/hooks/usePeopleActions";
import { usePeopleComplaints } from "~/hooks/usePeopleComplaints";
import { usePeopleData } from "~/hooks/usePeopleData";
import { usePeopleGallery } from "~/hooks/usePeopleGallery";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/people")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { openFastMeetId, cameFromList } = Route.useSearch() as {
    openFastMeetId?: number;
    cameFromList?: boolean;
  };
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useScrollRestoration("people");
  const isMobile = usePlatform();

  // State
  const [search, setSearch] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [preOpenFastMeetId, setPreOpenFastMeetId] = useState<number | null>(
    openFastMeetId ?? null,
  );

  // Initialize view mode from sessionStorage to persist state across navigation
  const [isList, setIsList] = useState(() => {
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem("people-view-mode") === "list";
    }
    return false;
  });

  // Persist view mode changes
  useEffect(() => {
    sessionStorage.setItem("people-view-mode", isList ? "list" : "map");
  }, [isList]);

  // Custom hooks
  const {
    users,
    user,
    fastMeets,
    getFilteredUsers,
    getUsersWithDistances,
    getSortedUsers,
    isFavorite,
    isComplained,
  } = usePeopleData();

  const { handleHideUser, handleToFavorites, handleSaveUser } = usePeopleActions(user);
  const galleryData = usePeopleGallery(users || []);
  const {
    isComplaintOpen,
    setIsComplaintOpen,
    complaint,
    setComplaint,
    openComplaintDrawer,
    handleSubmitComplaint,
  } = usePeopleComplaints(user);

  // Computed data
  const filteredUsers = useMemo(
    () => getFilteredUsers(search),
    [getFilteredUsers, search],
  );
  const usersWithDistances = useMemo(
    () => getUsersWithDistances(filteredUsers || [], user?.coordinates || null),
    [getUsersWithDistances, filteredUsers, user?.coordinates],
  );
  const sortedUsers = useMemo(
    () => getSortedUsers(usersWithDistances),
    [getSortedUsers, usersWithDistances],
  );

  // Handlers
  const handleUserMoreClick = (userId: number) => {
    setSelectedUser(userId);
    setIsDrawerOpen(true);
  };

  const handleComplaintAction = () => {
    if (!selectedUser) return;
    openComplaintDrawer(selectedUser, isComplained(selectedUser));
    setIsDrawerOpen(false);
  };

  const handleSaveAction = () => {
    if (!selectedUser) return;
    handleSaveUser(selectedUser);
  };

  const handleHideAction = (userId: number) => {
    handleHideUser(userId);
    setIsDrawerOpen(false);
  };

  const handleRefresh = async () => {
    setIsFetchingMore(true);
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUsers.queryKey(),
    });
    setIsFetchingMore(false);
  };

  return (
    <div
      data-mobile={isMobile}
      className={cn(
        "min-h-screen bg-gray-50/50 pt-14 data-[mobile=true]:pt-39",
        isList ? "pb-24" : "h-screen overflow-hidden pb-0",
      )}
    >
      <Header />

      <PullToRefresh
        onRefresh={handleRefresh}
        className={cn(
          "min-h-screen",
          !isList && "fixed inset-0 z-0 h-full overflow-hidden",
        )}
        pullDownThreshold={isList ? 67 : 9999} // Disable pull-to-refresh on map view by setting high threshold
        isPullable={isList}
      >
        <div
          data-mobile={isMobile}
          className={cn(
            "flex flex-col gap-4",
            !isList && "h-full overflow-hidden pt-14 data-[mobile=true]:pt-39",
          )}
        >
          <PeopleHeader
            search={search}
            setSearch={setSearch}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
          />

          {/* View Toggle */}
          <div className="shrink-0 px-4">
            <div className="relative flex h-12 w-full items-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
              <div
                className={cn(
                  "absolute inset-y-1 w-1/2 rounded-xl bg-gray-900 transition-all duration-300 ease-in-out",
                  isList ? "left-[calc(50%-4px)] translate-x-1" : "left-1",
                )}
              />

              <button
                onClick={() => setIsList(false)}
                className={cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-2 text-sm font-medium transition-colors duration-200",
                  !isList ? "text-white" : "text-gray-500",
                )}
              >
                <Map className="h-4 w-4" />
                <span>На карте</span>
              </button>

              <button
                onClick={() => setIsList(true)}
                className={cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-2 text-sm font-medium transition-colors duration-200",
                  isList ? "text-white" : "text-gray-500",
                )}
              >
                <List className="h-4 w-4" />
                <span>Списком</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isList ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4"
              >
                <UsersList
                  users={sortedUsers || []}
                  galleryData={galleryData}
                  isFavorite={isFavorite}
                  onFavoriteClick={(userId) =>
                    handleToFavorites(userId, isFavorite(userId))
                  }
                  onMoreClick={handleUserMoreClick}
                />
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full flex-1 overflow-hidden overscroll-none px-4 pb-24" // Fill remaining space
              >
                <div className="h-full w-full overflow-hidden rounded-3xl shadow-md ring-1 ring-gray-200">
                  <PeopleMap
                    users={sortedUsers || []}
                    currentUser={user}
                    fastMeets={fastMeets || []}
                    className="h-full w-full"
                    preOpenFastMeetId={preOpenFastMeetId ?? undefined}
                    preOpenCameFromList={cameFromList ?? false}
                    isFetchingMore={isFetchingMore}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PeopleDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          userId={selectedUser as number}
          onComplain={handleComplaintAction}
          onSave={handleSaveAction}
          onHide={handleHideAction}
          user={user as User}
          isComplained={selectedUser ? isComplained(selectedUser) : false}
        />

        {galleryData.isFullScreen && galleryData.fullScreenPhotos.length > 0 && (
          <FullScreenPhoto
            allPhotos={galleryData.fullScreenPhotos}
            currentIndex={galleryData.fullScreenIndex}
            setCurrentIndex={galleryData.setFullScreenIndex}
            setIsFullScreen={galleryData.setIsFullScreen}
          />
        )}

        {isComplaintOpen && (
          <ComplaintDrawer
            handleSendComplaint={() => {
              if (selectedUser) {
                handleSubmitComplaint(selectedUser);
              }
            }}
            complaint={complaint}
            setComplaint={setComplaint}
            open={isComplaintOpen}
            onOpenChange={setIsComplaintOpen}
            userId={selectedUser as number}
            type="user"
            isComplained={selectedUser ? isComplained(selectedUser) : false}
          />
        )}
      </PullToRefresh>
    </div>
  );
}
