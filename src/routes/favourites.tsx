import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import { MeetCard } from "~/components/MeetCard";
import PeopleDrawer from "~/components/PeopleDrawer";
import { QuestCard } from "~/components/QuestCard";
import { Meet, User } from "~/db/schema";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils/cn";
import { getAge } from "~/lib/utils/getAge";
import { getEventData } from "~/lib/utils/getEventData";
import { getImage } from "~/lib/utils/getImage";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/favourites")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();
  const isMobile = usePlatform();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaint, setComplaint] = useState("");

  const [activeFilter, setActiveFilter] = useState<string>("События");
  const filters = [
    { name: "События", count: user?.savedEvents?.length || 0 },
    { name: "Встречи", count: user?.savedMeetsIds?.length || 0 },
    { name: "Люди", count: user?.savedIds?.length || 0 },
  ];
  const { data: meets } = useQuery(trpc.meetings.getMeetings.queryOptions());

  const userMeetings = useMemo(() => {
    return meets?.filter((meet) => user?.savedMeetsIds?.includes(meet.id));
  }, [meets, user?.savedMeetsIds]);

  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  const queryClient = useQueryClient();

  const userSaved = useMemo(() => {
    return users?.filter((u) => user?.savedIds?.includes(u.id));
  }, [users, user?.savedIds]);

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

  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());

  const submitComplaint = (complaintText: string, type: "event" | "user") => {
    if (!selectedUser) return;
    sendComplaint.mutate({
      toUserId: selectedUser,
      complaint: complaintText,
      type,
    });
    setIsComplaintOpen(false);
    setComplaint("");
  };

  const openComplaintDrawer = () => {
    setIsComplaintOpen(true);
  };

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

  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());

  const isComplained = useMemo(() => {
    return complaints?.some((c) => c.type === "user" && c.toUserId === selectedUser);
  }, [complaints, selectedUser]);

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-42"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center">
          <div className="flex-1">
            <h1 className="text-center text-base font-bold text-gray-800">Избранное</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>
      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-10 overflow-x-auto px-4">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setActiveFilter(filter.name)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.name
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            {filter.name}
          </button>
        ))}
      </div>
      {activeFilter === "События" && (
        <div className="flex flex-col gap-4">
          {user?.savedEvents?.map((event: any) => {
            const eventData = getEventData(event.type, event.eventId);
            return (
              <div className="px-4">
                <QuestCard quest={eventData as Quest} isNavigable={true} />
                <p className="mb-4 text-xs leading-4 text-black">
                  {(() => {
                    const description = eventData?.description;
                    return description && description.length > 100
                      ? description.slice(0, 100) + "..."
                      : description;
                  })()}
                </p>
                <div className="mb-6 flex items-center justify-between">
                  {eventData?.hasAchievement ? (
                    <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                      + Достижение
                    </span>
                  ) : (
                    <div></div>
                  )}
                  {/* {eventData?.reward ? (
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-base font-medium text-black">
                        +
                        {eventData?.reward?.toLocaleString() || 0}
                      </span>
                      <span className="text-base font-medium text-black">points</span>
                      <Coin />
                    </div>
                  ) : (
                    <div></div>
                  )} */}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {activeFilter === "Встречи" && userMeetings && (
        <div className="flex flex-col gap-4 px-4">
          {user?.savedMeetsIds?.map((meetId) => {
            const meetData = userMeetings.find((meet) => meet.id === meetId);
            return (
              <div key={meetId}>
                <MeetCard meet={meetData as Meet} isNavigable={true} />
              </div>
            );
          })}
        </div>
      )}
      {activeFilter === "Люди" && userSaved && (
        <div className="flex flex-col gap-4">
          {user?.savedIds?.map((userId) => {
            const userData = userSaved.find((user) => user.id === userId);

            return (
              <div key={userData?.id}>
                <div className="flex flex-col items-start justify-center">
                  <div className="relative w-full">
                    <img
                      src={getImage(userData as any, "")}
                      alt={userData?.name || ""}
                      className="h-60 w-full rounded-lg object-cover"
                      onClick={() => {
                        saveScrollPosition("people");
                        navigate({
                          to: "/user-profile/$id",
                          params: { id: userData?.id?.toString() || "" },
                        });
                      }}
                    />
                    <div
                      onClick={() => {
                        setSelectedUser(userData?.id || null);
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
                        {userData?.name} {userData?.surname}
                      </div>
                    </div>

                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToFavorites(userData?.id || 0);
                      }}
                    >
                      <Heart
                        className={cn(
                          "h-6 w-6 text-black",
                          isFavorite(userData?.id || 0) && "text-red-500",
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex w-full items-center justify-between px-4 pb-4">
                    <div className="text-sm text-neutral-500">
                      г. {userData?.city}, {getAge(userData?.birthday) || "не указано"}
                    </div>
                    <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">
                      Рейтинг 4.5
                    </div>
                  </div>
                  <div className="px-4">
                    <div className="text-sm">
                      {userData?.bio?.length && userData?.bio?.length > 100
                        ? userData?.bio?.slice(0, 100) + "..."
                        : userData?.bio || "не указано"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
