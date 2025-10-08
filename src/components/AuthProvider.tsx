import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLocationSaver } from "~/hooks/useLocationSaver";
import { actions } from "~/store/checkInStore";
import { useTRPC } from "~/trpc/init/react";
import { OnboardingPage } from "./OnboardingPage";
import { FullPageSpinner } from "./Spinner";
// Компонент-обертка для клиентской геолокации
const ClientLocationSaver = () => {
  useLocationSaver();
  return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setIsCheckedInToday } = actions;
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [initData, setInitData] = useState<string | null>(null);
  const [startParam, setStartParam] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();

  // Получаем данные пользователя для проверки статуса онбординга
  const userQuery = useQuery({
    ...trpc.main.getUser.queryOptions(),
    enabled: loggedIn,
  });

  const loginMutation = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: async (data) => {
        setLoggedIn(true);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastCheck = data.lastCheckIn ? new Date(data.lastCheckIn) : undefined;
        const lastStart = lastCheck
          ? new Date(lastCheck.getFullYear(), lastCheck.getMonth(), lastCheck.getDate())
          : undefined;

        const isCheckedToday =
          !!lastStart && lastStart.getTime() === startOfToday.getTime();
        setIsCheckedInToday(isCheckedToday);

        // Сразу устанавливаем данные пользователя в кэш
        queryClient.prefetchQuery(
          trpc.meetings.getMeetingsPagination.queryOptions({
            limit: 10,
          }),
        );
        queryClient.prefetchQuery(trpc.main.getReviews.queryOptions());
        queryClient.prefetchQuery(trpc.main.getUsers.queryOptions());
        queryClient.prefetchQuery(trpc.event.getEvents.queryOptions());

        queryClient.setQueryData(trpc.main.getNotifications.queryKey(), []);
        queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), []);
        queryClient.setQueryData(trpc.main.getUserSubscribers.queryKey(), []);
      },
    }),
  );

  //   const prefetch = async () => {
  //     await queryClient.prefetchQuery(trpc.main.getUser.queryOptions());
  //     await queryClient.prefetchQuery(trpc.main.getRemaining.queryOptions());
  //     await queryClient.prefetchQuery(trpc.tasks.getTasks.queryOptions());
  //   };

  useEffect(() => {
    const loadTelegramSDK = async () => {
      const { retrieveRawInitData, retrieveLaunchParams } = await import(
        "@telegram-apps/sdk"
      );

      const getTelegramInitData = retrieveRawInitData();
      const getTelegramLaunchParams = retrieveLaunchParams();

      setInitData(getTelegramInitData!);
      setStartParam(getTelegramLaunchParams.tgWebAppStartParam);
    };

    loadTelegramSDK();
  }, []);

  useEffect(() => {
    if (!initData) {
      return;
    }
    loginMutation.mutate({
      initData,
      startParam,
    });
  }, [initData, startParam]);

  //   useEffect(() => {
  //     prefetch();
  //   }, []);
  // Показываем онбординг если пользователь залогинен но не прошел онбординг
  if (loggedIn && userQuery.data && !userQuery.data.isOnboarded) {
    return <OnboardingPage />;
  }

  if (!loggedIn || userQuery.isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <>
      {typeof window !== "undefined" && <ClientLocationSaver />}
      {children}
    </>
  );
};
