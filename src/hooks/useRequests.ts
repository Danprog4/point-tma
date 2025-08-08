import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTRPC } from "~/trpc/init/react";

export function useRequests(
  currentUserId?: number,
  meetings: any[] = [],
  users: any[] = [],
) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery(trpc.meetings.getRequests.queryOptions());

  const pendingInvites = useMemo(
    () =>
      requests.filter(
        (r: any) =>
          r.status === "pending" && !r.isRequest && r.toUserId === currentUserId,
      ),
    [requests, currentUserId],
  );

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r: any) => r.status === "pending" && r.isRequest && r.toUserId === currentUserId,
      ),
    [requests, currentUserId],
  );

  const sentInvites = useMemo(
    () =>
      requests.filter(
        (r: any) =>
          r.status === "pending" && !r.isRequest && r.fromUserId === currentUserId,
      ),
    [requests, currentUserId],
  );

  const enrich = (r: any) => ({
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
      old.filter((r) => r.id !== id),
    );

  const accept = useCallback(
    (r: any) => {
      optimisticRemove(r.id);
      acceptMutation.mutate({ meetId: r.meetId, fromUserId: r.fromUserId });
    },
    [acceptMutation],
  );

  const decline = useCallback(
    (r: any) => {
      optimisticRemove(r.id);
      declineMutation.mutate({ meetId: r.meetId, fromUserId: r.fromUserId });
    },
    [declineMutation],
  );

  const isInvitedToMeeting = useCallback(
    (meetId: number) => pendingInvites.some((r: any) => r.meetId === meetId),
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

    accept,
    decline,

    isInvitedToMeeting,
  };
}
