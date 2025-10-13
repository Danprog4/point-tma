import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import { FullScreenPhoto } from "~/components/FullScreenPhoto";
import GetUpButton from "~/components/getUpButton";
import { Header } from "~/components/Header";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { PeopleHeader, PeopleMap, UsersList, ViewToggle } from "~/components/people";
import PeopleDrawer from "~/components/PeopleDrawer";
import { User } from "~/db/schema";
import { usePeopleActions } from "~/hooks/usePeopleActions";
import { usePeopleComplaints } from "~/hooks/usePeopleComplaints";
import { usePeopleData } from "~/hooks/usePeopleData";
import { usePeopleGallery } from "~/hooks/usePeopleGallery";
import { usePlatform } from "~/hooks/usePlatform";
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

  // Restore saved scroll position (if any) when returning to the list
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
  const [isList, setIsList] = useState(false);

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
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUsers.queryKey(),
    });
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-14 pb-24 data-[mobile=true]:pt-39"
    >
      <Header />
      <PullToRefresh onRefresh={handleRefresh} className="text-white">
        <PeopleHeader
          search={search}
          setSearch={setSearch}
          isFilterOpen={isFilterOpen}
          setIsFilterOpen={setIsFilterOpen}
        />

        <ViewToggle isList={isList} setIsList={setIsList} />

        {isList && (
          <>
            <UsersList
              users={sortedUsers || []}
              galleryData={galleryData}
              isFavorite={isFavorite}
              onFavoriteClick={(userId) => handleToFavorites(userId, isFavorite(userId))}
              onMoreClick={handleUserMoreClick}
            />
            <GetUpButton />
          </>
        )}

        {!isList && (
          <PeopleMap
            users={sortedUsers || []}
            currentUser={user}
            fastMeets={fastMeets || []}
            className="px-4"
            preOpenFastMeetId={preOpenFastMeetId ?? undefined}
            preOpenCameFromList={cameFromList ?? false}
          />
        )}

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
