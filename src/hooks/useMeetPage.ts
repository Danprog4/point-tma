import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/init/react";
import { useRequests } from "./useRequests";

export type UseMeetPageResult = ReturnType<typeof useMeetPage>;

export function useMeetPage(meetId: number) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  // Base data
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());
  const { data: meetingsData } = useQuery(trpc.meetings.getMeetings.queryOptions());
  const { data: chatMessages } = useQuery(
    trpc.meetings.getMessages.queryOptions({ meetId }),
  );
  const { data: userParticipants } = useQuery(
    trpc.meetings.getParticipants.queryOptions(),
  );

  // Meeting with organizer attached
  const meetingsWithEvents = useMemo(() => {
    return meetingsData?.map((m) => ({
      ...m,
      organizer: users?.find((u) => u.id === m.userId),
    }));
  }, [meetingsData, users]);

  const meeting = useMemo(() => {
    return meetingsWithEvents?.find((m) => m.id === meetId);
  }, [meetingsWithEvents, meetId]);

  const organizer = meeting?.organizer;
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
    return complaints?.some((c) => c.meetId === meeting?.id && c.userId === user?.id);
  }, [complaints, meeting?.id, user?.id]);

  // Ratings
  const { data: userRating } = useQuery(
    trpc.main.getUserRating.queryOptions({ meetId: meeting?.id! }),
  );
  const { data: meetRating } = useQuery(
    trpc.main.getMeetRating.queryOptions({ meetId: meeting?.id! }),
  );

  // Requests/Invites helper
  const {
    pendingInvitesForMeet: invitesForUser,
    pendingRequestsForMeet: filteredRequests,
    sentInvitesForMeet: invitedUsers,
    accept,
    decline,
  } = useRequests(user?.id, meetingsData || [], users || [], meetId);

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
        qc.invalidateQueries({ queryKey: trpc.meetings.getMessages.queryKey() });
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
      qc.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any) =>
        (old || []).map((r: any) =>
          r.id === meeting.id
            ? {
                ...r,
                participantsIds: (r.participantsIds || []).filter(
                  (p: any) => p !== user?.id,
                ),
              }
            : r,
        ),
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
    qc.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any) =>
      (old || []).map((m: any) =>
        m.id === meeting?.id ? { ...m, isCompleted: true } : m,
      ),
    );
  };

  const handleSendComplaint = (complaint: string) => {
    if (!meeting?.id) return;
    sendComplaint.mutate({ meetId: meeting.id, complaint });
    qc.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => [
      ...(old || []),
      { meetId: meeting.id, userId: user?.id!, complaint },
    ]);
  };

  const handleUnsendComplaint = () => {
    if (!meeting?.id) return;
    unsendComplaint.mutate({ id: meeting.id });
    qc.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) =>
      (old || []).filter((c: any) => c.meetId !== meeting.id),
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
    qc.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any) =>
      (old || []).map((m: any) =>
        m.id === meeting?.id
          ? {
              ...m,
              participantsIds: (m.participantsIds || []).filter((p: any) => p !== userId),
            }
          : m,
      ),
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
