import { useState, useEffect } from "react";

interface GeolocationState {
  coordinates: [number, number] | null;
  error: string | null;
  loading: boolean;
  isSupported: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoStart?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    autoStart = false,
  } = options;

  // Проверяем, что мы в браузере
  const isClient = typeof window !== 'undefined';
  const isGeolocationSupported = isClient && 'geolocation' in navigator;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
    isSupported: isGeolocationSupported,
  });

  const getCurrentLocation = () => {
    // Дополнительная проверка при вызове функции
    if (!isClient) {
      setState(prev => ({
        ...prev,
        error: "Геолокация недоступна на сервере",
        loading: false,
      }));
      return;
    }

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: "Геолокация не поддерживается этим браузером",
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setState({
          coordinates,
          error: null,
          loading: false,
          isSupported: isGeolocationSupported,
        });
      },
      (error) => {
        let errorMessage = "Ошибка получения местоположения";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Пользователь запретил доступ к геолокации";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Информация о местоположении недоступна";
            break;
          case error.TIMEOUT:
            errorMessage = "Время ожидания геолокации истекло";
            break;
        }
        setState({
          coordinates: null,
          error: errorMessage,
          loading: false,
          isSupported: isGeolocationSupported,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  };

  useEffect(() => {
    if (autoStart && isClient) {
      getCurrentLocation();
    }
  }, [autoStart, isClient]);

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    getCurrentLocation,
    clearError,
  };
};
