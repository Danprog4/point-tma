import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/init/react";
import { useRequests } from "./useRequests";

export type UseMeetPageResult = ReturnType<typeof useMeetPage>;

export function useMeetPage(meetId: number) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  // Current user (already cached from AuthProvider)
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  // Fetch only the specific meeting by ID
  const { data: meeting } = useQuery(
    trpc.meetings.getMeetingById.queryOptions({ id: meetId }),
  );

  // Collect all user IDs we need to fetch
  const userIdsToFetch = useMemo(() => {
    const ids = new Set<number>();
    if (meeting?.userId) ids.add(meeting.userId);
    if (meeting?.participantsIds) {
      meeting.participantsIds.forEach((id: any) => {
        const numId = Number(id);
        if (numId) ids.add(numId);
      });
    }
    return Array.from(ids);
  }, [meeting?.userId, meeting?.participantsIds]);

  // Fetch only needed users
  const { data: users } = useQuery({
    ...trpc.main.getUsersByIds.queryOptions({ ids: userIdsToFetch }),
    enabled: userIdsToFetch.length > 0,
  });

  // These queries are lightweight or needed for functionality
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());
  const { data: chatMessages } = useQuery(
    trpc.meetings.getMessages.queryOptions({ meetId }),
  );
  const { data: userParticipants } = useQuery(
    trpc.meetings.getParticipants.queryOptions(),
  );

  // Organizer from users list
  const organizer = useMemo(() => {
    return users?.find((u) => u.id === meeting?.userId);
  }, [users, meeting?.userId]);

  const isOwner = organizer?.id === user?.id;

  const isParticipant = useMemo(() => {
    return userParticipants?.some(
      (p) =>
        p.meetId === meeting?.id &&
        (p.fromUserId === user?.id || p.toUserId === user?.id) &&
        p.status === "accepted",
    );
  }, [userParticipants, meeting?.id, user?.id]);

  const isRequestParticipant = useMemo(() => {
    return userParticipants
      ?.filter((p) => p.status === "pending")
      .some(
        (p) =>
          p.meetId === meeting?.id &&
          (p.fromUserId === user?.id || p.toUserId === user?.id),
      );
  }, [userParticipants, meeting?.id, user?.id]);

  const isComplaint = useMemo(() => {
    return complaints?.some((c) => c.meetId === meeting?.id && c.fromUserId === user?.id);
  }, [complaints, meeting?.id, user?.id]);

  // Ratings - only fetch when meeting is loaded
  const { data: userRating } = useQuery({
    ...trpc.main.getUserRating.queryOptions({ meetId: meeting?.id! }),
    enabled: !!meeting?.id,
  });
  const { data: meetRating } = useQuery({
    ...trpc.main.getMeetRating.queryOptions({ meetId: meeting?.id! }),
    enabled: !!meeting?.id,
  });

  // Requests/Invites helper - pass meeting as array for compatibility
  const meetingsForRequests = useMemo(
    () => (meeting ? [meeting] : []),
    [meeting],
  );
  const {
    pendingInvitesForMeet: invitesForUser,
    pendingRequestsForMeet: filteredRequests,
    sentInvitesForMeet: invitedUsers,
    accept,
    decline,
  } = useRequests(user?.id, meetingsForRequests, users || [], meetId);

  const isInvited = invitesForUser.length > 0;

  // Mutations
  const deleteParticipant = useMutation(
    trpc.meetings.deleteParticipant.mutationOptions(),
  );
  const endMeeting = useMutation(trpc.meetings.endMeeting.mutationOptions());
  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());
  const unsendComplaint = useMutation(trpc.main.unsendComplaint.mutationOptions());
  const joinMeeting = useMutation(trpc.meetings.joinMeeting.mutationOptions());
  const leaveMeeting = useMutation(trpc.meetings.leaveMeeting.mutationOptions());
  const inviteUsers = useMutation(
    trpc.meetings.inviteUsers.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: trpc.meetings.getRequests.queryKey() });
      },
    }),
  );
  const sendChatMessage = useMutation(
    trpc.meetings.sendMessage.mutationOptions({
      onSuccess: (newMessage: any) => {
        qc.invalidateQueries({
          queryKey: trpc.meetings.getMessages.queryKey({ meetId }),
        });
      },
      onError: (err: any) => {
        toast.error(err.message || "Ошибка отправки сообщения");
      },
    }),
  );
  const rateUsers = useMutation(
    trpc.main.rateUsers.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: trpc.main.getUserRating.queryKey() });
      },
    }),
  );

  // Chat rate-limit
  const [chatTimestamps, setChatTimestamps] = useState<number[]>([]);
  const handleSendChatMessage = (msg: string) => {
    if (!meeting?.id) return;
    const now = Date.now();
    const recent = chatTimestamps.filter((t) => now - t < 60_000);
    if (recent.length >= 2) {
      toast.error("Можно отправлять не более 2 сообщений в минуту");
      return;
    }
    setChatTimestamps([...recent, now]);
    sendChatMessage.mutate({ meetId: meeting.id, message: msg });
    qc.setQueryData(
      trpc.meetings.getMessages.queryKey({ meetId: meeting.id }),
      (old: any) => {
        const existing = Array.isArray(old) ? old : [];
        return [
          ...existing,
          {
            id: Math.random(),
            message: msg,
            userId: user?.id,
            createdAt: new Date(),
            meetId: meeting.id,
          },
        ];
      },
    );
  };

  // Handlers
  const handleJoin = () => {
    if (!meeting?.id || isOwner) return;

    if (isParticipant || isRequestParticipant) {
      leaveMeeting.mutate({ id: meeting.id });
      // Clean caches
      qc.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) =>
        (old || []).filter((p: any) => p.meetId !== meeting.id),
      );
      qc.setQueryData(trpc.meetings.getRequests.queryKey(), (old: any) =>
        (old || []).filter((r: any) => r.meetId !== meeting.id),
      );
      // Update the specific meeting cache
      qc.setQueryData(
        trpc.meetings.getMeetingById.queryKey({ id: meeting.id }),
        (old: any) =>
          old
            ? {
                ...old,
                participantsIds: (old.participantsIds || []).filter(
                  (p: any) => p !== user?.id,
                ),
              }
            : old,
      );
    } else {
      joinMeeting.mutate({ id: meeting.id });
      // Add pending participant row
      qc.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => [
        ...(old || []),
        {
          fromUserId: user?.id!,
          toUserId: organizer?.id!,
          meetId: meeting.id,
          status: "pending",
        },
      ]);
    }
  };

  const handleEndMeeting = () => {
    endMeeting.mutate({ id: meeting?.id! });
    qc.setQueryData(
      trpc.meetings.getMeetingById.queryKey({ id: meeting?.id! }),
      (old: any) => (old ? { ...old, isCompleted: true } : old),
    );
  };

  const handleSendComplaint = (complaint: string, type: "event" | "user") => {
    if (!meeting?.id) return;
    sendComplaint.mutate({ meetId: meeting.id, complaint, type });
    qc.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => [
      ...(old || []),
      { meetId: meeting.id, fromUserId: user?.id!, complaint, type },
    ]);
  };

  const handleUnsendComplaint = (type: "event" | "user") => {
    if (!meeting?.id) return;
    unsendComplaint.mutate({ meetId: meeting.id, type });
    qc.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) =>
      (old || []).filter((c: any) => c.meetId !== meeting.id && c.type === type),
    );
  };

  const handleRateUsers = (userIds: number[], rating: number) => {
    if (!meeting?.id) return;
    rateUsers.mutate({ userIds, rating, meetId: meeting.id });
  };

  const inviteUsersByIds = (userIds: number[]) => {
    if (!meeting?.id || userIds.length === 0) return;
    inviteUsers.mutate({ meetId: meeting.id, userIds });
  };

  const handleDeleteParticipant = (userId: number) => {
    if (!meeting?.id) return;
    deleteParticipant.mutate({ userId, meetId: meeting.id });
    qc.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) =>
      (old || []).filter((p: any) => p.toUserId !== userId),
    );
    qc.setQueryData(
      trpc.meetings.getMeetingById.queryKey({ id: meeting.id }),
      (old: any) =>
        old
          ? {
              ...old,
              participantsIds: (old.participantsIds || []).filter(
                (p: any) => p !== userId,
              ),
            }
          : old,
    );
  };

  const allParticipantIds = useMemo(() => {
    const ids = [organizer?.id, ...(meeting?.participantsIds || [])]
      .map((n) => Number(n))
      .filter(Boolean);
    return Array.from(new Set(ids));
  }, [organizer?.id, meeting?.participantsIds]);

  return {
    // data
    users,
    user,
    friends,
    chatMessages,

    meeting,
    organizer,

    // derived
    isOwner,
    isParticipant,
    isRequestParticipant,
    isComplaint,
    isInvited,

    userRating,
    meetRating,

    invitesForUser,
    filteredRequests,
    invitedUsers,

    // participants
    allParticipantIds,

    // handlers
    handleJoin,
    handleEndMeeting,
    handleSendComplaint,
    handleUnsendComplaint,
    handleRateUsers,
    accept,
    decline,
    inviteUsersByIds,
    handleSendChatMessage,
    handleDeleteParticipant,
  };
}
