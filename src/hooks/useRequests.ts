import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTRPC } from "~/trpc/init/react";

type Status = "pending" | "accepted" | "declined";

type RequestItem = {
  id: number;
  meetId: number;
  fromUserId: number;
  toUserId: number;
  status: Status;
  isRequest: boolean; // true: user requests to join; false: organizer invites user
};

export function useRequests(
  currentUserId?: number,
  meetings: any[] = [],
  users: any[] = [],
  meetId?: number,
) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: rawRequests = [] } = useQuery(trpc.meetings.getRequests.queryOptions());

  const requests: RequestItem[] = useMemo(() => {
    return (rawRequests as any[])
      .map((r) => ({
        id: Number(r.id),
        meetId: Number(r.meetId),
        fromUserId: Number(r.fromUserId),
        toUserId: Number(r.toUserId),
        status: ((r.status as string) || "pending") as Status,
        isRequest: Boolean(r.isRequest),
      }))
      .filter(
        (r) =>
          Number.isFinite(r.id) &&
          Number.isFinite(r.meetId) &&
          Number.isFinite(r.fromUserId) &&
          Number.isFinite(r.toUserId),
      );
  }, [rawRequests]);

  // Buckets
  const pendingInvites = useMemo(
    () =>
      requests.filter(
        (r) => r.status === "pending" && !r.isRequest && r.toUserId === currentUserId,
      ),
    [requests, currentUserId],
  );

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r) => r.status === "pending" && r.isRequest && r.toUserId === currentUserId,
      ),
    [requests, currentUserId],
  );

  const sentInvites = useMemo(
    () =>
      requests.filter(
        (r) => r.status === "pending" && !r.isRequest && r.fromUserId === currentUserId,
      ),
    [requests, currentUserId],
  );

  // Per-meeting views
  const pendingInvitesForMeet = useMemo(
    () => (meetId ? pendingInvites.filter((r) => r.meetId === meetId) : []),
    [pendingInvites, meetId],
  );

  const pendingRequestsForMeet = useMemo(
    () => (meetId ? pendingRequests.filter((r) => r.meetId === meetId) : []),
    [pendingRequests, meetId],
  );

  const sentInvitesForMeet = useMemo(
    () => (meetId ? sentInvites.filter((r) => r.meetId === meetId) : []),
    [sentInvites, meetId],
  );

  const enrich = (r: RequestItem) => ({
    ...r,
    meeting: meetings.find((m) => m.id === r.meetId),
    fromUser: users.find((u) => u.id === r.fromUserId),
    toUser: users.find((u) => u.id === r.toUserId),
  });

  const pendingInvitesInfo = useMemo(
    () => pendingInvites.map(enrich),
    [pendingInvites, meetings, users],
  );
  const pendingRequestsInfo = useMemo(
    () => pendingRequests.map(enrich),
    [pendingRequests, meetings, users],
  );
  const sentInvitesInfo = useMemo(
    () => sentInvites.map(enrich),
    [sentInvites, meetings, users],
  );

  const acceptMutation = useMutation(trpc.meetings.acceptRequest.mutationOptions());
  const declineMutation = useMutation(trpc.meetings.declineRequest.mutationOptions());

  const optimisticRemove = (id: number) =>
    qc.setQueryData(trpc.meetings.getRequests.queryKey(), (old: any[] = []) =>
      (old || []).filter((r: any) => r.id !== id),
    );

  const accept = useCallback(
    (r: RequestItem) => {
      optimisticRemove(r.id);

      // participants → mark accepted or add if missing
      qc.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any[] = []) => {
        const updated = old.map((p: any) =>
          p.meetId === r.meetId &&
          p.fromUserId === r.fromUserId &&
          p.toUserId === r.toUserId
            ? { ...p, status: "accepted" }
            : p,
        );

        const exists = updated.some(
          (p: any) =>
            p.meetId === r.meetId &&
            p.fromUserId === r.fromUserId &&
            p.toUserId === r.toUserId &&
            p.status === "accepted",
        );

        return exists
          ? updated
          : [
              ...updated,
              {
                fromUserId: r.fromUserId,
                toUserId: r.toUserId,
                meetId: r.meetId,
                status: "accepted",
              },
            ];
      });

      // meetings → add the actual participant user id
      const participantUserId = r.isRequest ? r.fromUserId : r.toUserId;
      qc.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any[] = []) =>
        old.map((m: any) =>
          m.id === r.meetId
            ? {
                ...m,
                participantsIds: Array.from(
                  new Set([...(m.participantsIds || []), participantUserId]),
                ),
              }
            : m,
        ),
      );

      acceptMutation.mutate({ meetId: r.meetId, fromUserId: r.fromUserId });
    },
    [acceptMutation, qc],
  );

  const decline = useCallback(
    (r: RequestItem) => {
      optimisticRemove(r.id);

      // participants → remove pending entry
      qc.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any[] = []) =>
        old.filter(
          (p: any) =>
            !(
              p.meetId === r.meetId &&
              p.fromUserId === r.fromUserId &&
              p.toUserId === r.toUserId &&
              p.status === "pending"
            ),
        ),
      );

      // meetings → remove the actual participant user id if it was optimistically added somewhere
      const participantUserId = r.isRequest ? r.fromUserId : r.toUserId;
      qc.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any[] = []) =>
        old.map((m: any) =>
          m.id === r.meetId
            ? {
                ...m,
                participantsIds: (m.participantsIds || []).filter(
                  (uid: number) => uid !== participantUserId,
                ),
              }
            : m,
        ),
      );

      declineMutation.mutate({ meetId: r.meetId, fromUserId: r.fromUserId });
    },
    [declineMutation, qc],
  );

  const isInvitedToMeeting = useCallback(
    (id: number) => pendingInvites.some((r) => r.meetId === id),
    [pendingInvites],
  );

  return {
    requests,

    pendingInvites,
    pendingRequests,
    sentInvites,

    pendingInvitesInfo,
    pendingRequestsInfo,
    sentInvitesInfo,

    // meet-specific
    pendingInvitesForMeet,
    pendingRequestsForMeet,
    sentInvitesForMeet,

    accept,
    decline,

    isInvitedToMeeting,
  };
}
