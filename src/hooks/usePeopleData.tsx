import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { calculateDistanceFromCoords } from "~/lib/utils/calculateDistance";
import { useTRPC } from "~/trpc/init/react";

export const usePeopleData = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: userFavorites } = useQuery(trpc.main.getUserFavorites.queryOptions());
  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());

  const getFilteredUsers = (search: string) => {
    return users?.filter((u) => {
      if (user?.notInterestedIds?.includes(u.id)) {
        return false;
      }
      return (
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.surname?.toLowerCase().includes(search.toLowerCase()) ||
        u.login?.toLowerCase().includes(search.toLowerCase())
      );
    });
  };

  const getUsersWithDistances = (filteredUsers: any[], userCoordinates?: [number, number] | null) => {
    if (!userCoordinates || !filteredUsers) {
      return filteredUsers?.map((u) => ({ ...u, distance: null })) || [];
    }

    return filteredUsers.map((u) => {
      if (!u.coordinates) {
        return { ...u, distance: null };
      }

      const distance = calculateDistanceFromCoords(userCoordinates, u.coordinates);
      return { ...u, distance };
    });
  };

  const getSortedUsers = (usersWithDistances: any[]) => {
    return [...usersWithDistances].sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  };

  const isFavorite = useMemo(
    () => (favUserId: number) => Boolean(userFavorites?.some((f) => f.toUserId === favUserId)),
    [userFavorites],
  );

  const isComplained = useMemo(() => {
    return (userId: number) => Boolean(complaints?.some((c) => c.type === "user" && c.toUserId === userId));
  }, [complaints]);

  return {
    users,
    user,
    userFavorites,
    complaints,
    queryClient,
    trpc,
    getFilteredUsers,
    getUsersWithDistances,
    getSortedUsers,
    isFavorite,
    isComplained,
  };
};
