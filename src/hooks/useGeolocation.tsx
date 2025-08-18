import { useState, useEffect } from "react";

interface GeolocationState {
  coordinates: [number, number] | null;
  error: string | null;
  loading: boolean;
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

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
  });

  const getCurrentLocation = () => {
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
    if (autoStart) {
      getCurrentLocation();
    }
  }, [autoStart]);

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    getCurrentLocation,
    clearError,
    isSupported: !!navigator.geolocation,
  };
};
