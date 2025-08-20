import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FastMeet, FastMeetParticipant } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";

export function useFastMeet(meetId: number) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: currentUser } = useQuery(trpc.main.getUser.queryOptions());

  const { data: fastMeets } = useQuery(trpc.meetings.getFastMeets.queryOptions());

  const meet = useMemo(() => {
    return fastMeets?.find((m) => m.id === meetId);
  }, [fastMeets, meetId]);

  const { data: participants } = useQuery(
    trpc.meetings.getFastMeetParticipants.queryOptions({ meetId }),
  );

  const { data: allParticipants } = useQuery(
    trpc.meetings.getFastMeetParticipants.queryOptions({}),
  );

  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  // Mutations for accepting/declining participants
  const acceptFastMeetMutation = useMutation(
    trpc.meetings.acceptFastMeet.mutationOptions(),
  );
  const declineFastMeetMutation = useMutation(
    trpc.meetings.declineFastMeet.mutationOptions(),
  );
  const joinFastMeet = useMutation(trpc.meetings.joinFastMeet.mutationOptions());

  // Check if current user is the organizer
  const isOrganizer = meet?.userId === currentUser?.id;

  // Get organizer info
  const organizer = users?.find((user) => user.id === meet?.userId);

  // Filter pending requests for organizer view
  const pendingRequests =
    participants?.filter((participant) => participant.status === "pending") || [];

  // Filter accepted participants
  const acceptedParticipants =
    participants?.filter((participant) => participant.status === "accepted") || [];

  const isParticipant = participants?.some(
    (participant) =>
      participant.userId === currentUser?.id && participant.status === "pending",
  );

  const isAcceptedParticipant = participants?.some(
    (participant) =>
      participant.userId === currentUser?.id && participant.status === "accepted",
  );

  const isAlreadyParticipant = allParticipants?.some(
    (participant) =>
      participant.userId === currentUser?.id && participant.meetId !== meet?.id,
  );

  // Check if user owns any other fast meet
  const isAlreadyOwner = fastMeets?.some(
    (fastMeet) => fastMeet.userId === currentUser?.id && fastMeet.id !== meet?.id,
  );

  // Check if user is blocked from joining (owns another meet, or is participant in another meet)
  const isBlocked = isAlreadyOwner || isAlreadyParticipant;

  // Handle accepting a participant request
  const handleAcceptRequest = (participant: FastMeetParticipant) => {
    if (!participant.userId || !meet) return;

    acceptFastMeetMutation.mutate({ meetId: meet.id, userId: participant.userId });

    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.map((p) =>
          p.userId === participant.userId ? { ...p, status: "accepted" } : p,
        );
      },
    );

    // Update global participants list so map updates immediately
    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({}),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) {
          return [
            {
              id: Math.floor(Math.random() * 1000000),
              userId: participant.userId,
              status: "accepted",
              meetId: meet.id,
              createdAt: new Date(),
            },
          ];
        }
        const exists = old.some(
          (p) => p.meetId === meet.id && p.userId === participant.userId,
        );
        return exists
          ? old.map((p) =>
              p.meetId === meet.id && p.userId === participant.userId
                ? { ...p, status: "accepted" }
                : p,
            )
          : [
              ...old,
              {
                id: Math.floor(Math.random() * 1000000),
                userId: participant.userId,
                status: "accepted",
                meetId: meet.id,
                createdAt: new Date(),
              },
            ];
      },
    );
  };

  const leaveFastMeet = useMutation(
    trpc.meetings.leaveFastMeet.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getFastMeetParticipants.queryKey({ meetId }),
        });
      },
    }),
  );

  const handleLeaveFastMeet = () => {
    if (!meet) return;

    leaveFastMeet.mutate({ meetId: meet.id });

    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => p.userId !== currentUser?.id);
      },
    );

    // Remove from global participants as well
    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({}),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => !(p.meetId === meet.id && p.userId === currentUser?.id));
      },
    );
    setIsMoreOpen(false);
  };

  const deleteFastMeet = useMutation(trpc.meetings.deleteFastMeet.mutationOptions());

  const handleDeleteFastMeet = () => {
    if (!meet) return;

    deleteFastMeet.mutate({ meetId: meet.id });
    queryClient.setQueryData(
      trpc.meetings.getFastMeets.queryKey(),
      (old: FastMeet[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => p.id !== meet.id);
      },
    );

    // Clear per-meet participants
    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
      () => [],
    );

    // Remove all participants of this meet from global list
    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({}),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => p.meetId !== meet.id);
      },
    );
    setIsMoreOpen(false);
  };

  // Handle declining a participant request
  const handleDeclineRequest = (participant: FastMeetParticipant) => {
    if (!participant.userId || !meet) return;

    declineFastMeetMutation.mutate({ meetId: meet.id, userId: participant.userId });

    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => p.userId !== participant.userId);
      },
    );

    // Remove from global participants so map updates immediately
    queryClient.setQueryData(
      trpc.meetings.getFastMeetParticipants.queryKey({}),
      (old: FastMeetParticipant[] | undefined) => {
        if (!old) return [];
        return old.filter(
          (p) => !(p.meetId === meet.id && p.userId === participant.userId),
        );
      },
    );
  };

  const handleJoinFastMeet = () => {
    if (!meet) return;

    // If user is blocked from joining, return early
    if (isBlocked) {
      return;
    }

    if (isOrganizer) {
      setIsMoreOpen(true);
      return;
    }

    // Join or leave the meet
    if (!isParticipant && !isOrganizer) {
      joinFastMeet.mutate({ meetId: meet.id });
      queryClient.setQueryData(
        trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
        (old: FastMeetParticipant[] | undefined) => [
          ...(old || []),
          {
            id: Math.floor(Math.random() * 1000000),
            userId: currentUser?.id || null,
            status: "pending",
            meetId: meet.id,
            createdAt: new Date(),
          },
        ],
      );

      // Also add to global list
      queryClient.setQueryData(
        trpc.meetings.getFastMeetParticipants.queryKey({}),
        (old: FastMeetParticipant[] | undefined) => [
          ...(old || []),
          {
            id: Math.floor(Math.random() * 1000000),
            userId: currentUser?.id || null,
            status: "pending",
            meetId: meet.id,
            createdAt: new Date(),
          },
        ],
      );
    } else if (isParticipant && !isOrganizer) {
      joinFastMeet.mutate({ meetId: meet.id });
      queryClient.setQueryData(
        trpc.meetings.getFastMeetParticipants.queryKey({ meetId: meet.id }),
        (old: FastMeetParticipant[] | undefined) => [
          ...(old || []).filter((p) => p.userId !== currentUser?.id),
        ],
      );

      // And remove from global list
      queryClient.setQueryData(
        trpc.meetings.getFastMeetParticipants.queryKey({}),
        (old: FastMeetParticipant[] | undefined) =>
          (old || []).filter(
            (p) => !(p.meetId === meet.id && p.userId === currentUser?.id),
          ),
      );
    }
  };

  const editFastMeet = useMutation(trpc.meetings.editFastMeet.mutationOptions());

  return {
    meet,
    participants,
    users,
    isOrganizer,
    organizer,
    pendingRequests,
    acceptedParticipants,
    isParticipant,
    isAcceptedParticipant,
    isBlocked,
    isAlreadyOwner,
    handleAcceptRequest,
    handleLeaveFastMeet,
    handleDeleteFastMeet,
    handleDeclineRequest,
    handleJoinFastMeet,
    leaveFastMeet,
    deleteFastMeet,
    isMoreOpen,
    setIsMoreOpen,
  };
}
