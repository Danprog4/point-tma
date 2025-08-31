import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/init/react";

import { useNavigate } from "@tanstack/react-router";
import { useLocationSaver } from "~/hooks/useLocationSaver";
import { OnboardingPage } from "./OnboardingPage";
import { FullPageSpinner } from "./Spinner";
// Компонент-обертка для клиентской геолокации
const ClientLocationSaver = () => {
  useLocationSaver();
  return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
      onSuccess: (data) => {
        setLoggedIn(true);
        // Сразу устанавливаем данные пользователя в кэш
        queryClient.prefetchQuery(
          trpc.meetings.getMeetingsPagination.queryOptions({
            limit: 10,
          }),
        );
        queryClient.setQueryData(trpc.main.getUser.queryKey(), data);
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
