import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTRPC } from "~/trpc/init/react";
import { useGeolocation } from "./useGeolocation";

/**
 * Хук для автоматического сохранения геопозиции пользователя в БД
 * Использует геолокацию браузера и сохраняет координаты через TRPC
 */
export const useLocationSaver = () => {
  const trpc = useTRPC();
  const { coordinates, getCurrentLocation, error, isSupported } = useGeolocation({
    autoStart: true,
    maximumAge: 300000, // 5 минут кэш
  });

  const updateLocation = useMutation(trpc.main.updateLocation.mutationOptions());

  // Автоматически сохраняем координаты при получении
  useEffect(() => {
    if (coordinates && !updateLocation.isPending) {
      console.log("🌍 Сохраняем геопозицию пользователя:", coordinates);
      updateLocation.mutate(
        { coordinates },
        {
          onSuccess: () => {
            console.log("✅ Геопозиция сохранена успешно");
          },
          onError: (error) => {
            console.error("❌ Ошибка сохранения геопозиции:", error);
          },
        },
      );
    }
  }, [coordinates]);

  // Возможность вручную обновить местоположение
  const refreshLocation = () => {
    if (isSupported) {
      getCurrentLocation();
    }
  };

  return {
    coordinates,
    error,
    isSupported,
    isSaving: updateLocation.isPending,
    saveError: updateLocation.error,
    refreshLocation,
  };
};
