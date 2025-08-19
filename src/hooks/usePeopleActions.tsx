import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/init/react";

export const usePeopleActions = (user: any) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Hide/unhide user mutations
  const hideUser = useMutation(trpc.main.hideUser.mutationOptions());

  const handleHideUser = (userId: number) => {
    hideUser.mutate({ userId });

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

  // Favorites mutations
  const addToFavorites = useMutation(trpc.main.addToFavorites.mutationOptions());
  const removeFromFavorites = useMutation(trpc.main.removeFromFavorites.mutationOptions());

  const handleToFavorites = (favUserId: number, isFavorite: boolean) => {
    if (isFavorite) {
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

  // Save user mutations
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

  // Complaint mutations
  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());
  const unsendComplaint = useMutation(trpc.main.unsendComplaint.mutationOptions());

  const submitComplaint = (complaint: string, type: "event" | "user", selectedUser: number) => {
    sendComplaint.mutate({
      complaint,
      type,
      toUserId: selectedUser,
    });
    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return [
        ...(old || []),
        { type, toUserId: selectedUser, complaint, fromUserId: user?.id! },
      ];
    });
  };

  const handleUnsendComplaint = (type: "event" | "user", userId: number) => {
    unsendComplaint.mutate({
      toUserId: userId,
      type,
    });
    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return old.filter(
        (c: any) => c.toUserId !== userId && c.fromUserId !== user?.id,
      );
    });
  };

  return {
    handleHideUser,
    handleToFavorites,
    handleSaveUser,
    submitComplaint,
    handleUnsendComplaint,
  };
};
