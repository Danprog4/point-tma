import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTRPC } from "~/trpc/init/react";

export function useFriendsData() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: requests } = useQuery(trpc.friends.getRequests.queryOptions());

  const uniqueFriends = useMemo(() => {
    if (!friends || !user?.id) return [];
    const seen = new Set<number>();
    return friends
      .filter((r) => r.status === "accepted")
      .filter((r) => {
        const counterpartId = r.fromUserId === user.id ? r.toUserId : r.fromUserId;
        if (counterpartId == null) return false;
        if (seen.has(counterpartId)) return false;
        seen.add(counterpartId);
        return true;
      });
  }, [friends, user?.id]);

  const activeRequests = requests?.filter((request) => request.status === "pending");

  const acceptRequestMutation = useMutation(trpc.friends.acceptRequest.mutationOptions());
  const declineRequestMutation = useMutation(
    trpc.friends.declineRequest.mutationOptions(),
  );

  const acceptRequest = (userId: number) => {
    acceptRequestMutation.mutate({ userId });
    queryClient.setQueryData(trpc.friends.getRequests.queryKey(), (old: any) => {
      return old.map(
        (request: any) => request.id === request.id && { ...request, status: "accepted" },
      );
    });
  };

  const declineRequest = (userId: number) => {
    declineRequestMutation.mutate({ userId });
    queryClient.setQueryData(trpc.friends.getRequests.queryKey(), (old: any) => {
      return old.map(
        (request: any) => request.id === request.id && { ...request, status: "rejected" },
      );
    });
  };

  return {
    users,
    activeRequests,
    uniqueFriends,
    user,
    acceptRequest,
    declineRequest,
  };
}
