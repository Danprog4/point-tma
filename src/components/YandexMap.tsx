import React, { useEffect, useRef, useState } from "react";
import {
  calculateDistanceFromCoords,
  formatDistance,
} from "~/lib/utils/calculateDistance";
import { getYMapsReactComponents, loadYMapsScript } from "~/lib/ymaps";

interface MarkerWithDistance {
  coordinates: [number, number];
  distance?: number;
  label?: string;
  onClick?: () => void;
  meetData?: any;
}

interface YandexMapProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (coordinates: [number, number], address?: string) => void;
  className?: string;
  markers?: Array<[number, number]>;
  markersWithInfo?: Array<MarkerWithDistance>; // Маркеры с дополнительной информацией
  enableGeolocation?: boolean;
  autoGeolocation?: boolean; // Автоматически определять местоположение при загрузке
  onGeolocationSuccess?: (coordinates: [number, number]) => void; // Отдельный колбэк для успешной геолокации
  preventClickSelection?: boolean; // Предотвращать автоматический выбор при клике
  showSelectButton?: boolean; // Показывать кнопку "Выбрать это место" при клике
  showDistances?: boolean; // Показывать расстояния от текущего местоположения
}

export const YandexMap: React.FC<YandexMapProps> = ({
  center,
  zoom = 10,
  onLocationSelect,
  className = "w-full h-64 rounded-lg",
  markers = [],
  markersWithInfo = [],
  enableGeolocation = true,
  autoGeolocation = false,
  onGeolocationSuccess,
  preventClickSelection = false,
  showSelectButton = false,
  showDistances = true,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("Инициализация...");
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    center || [37.618423, 55.751244],
  ); // Default Moscow center
  const [clickedLocation, setClickedLocation] = useState<[number, number] | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    console.log("🗺️ YandexMap: useEffect", { center, zoom, className });
    try {
      console.log("🗺️ YandexMap: ensuring script");
      loadYMapsScript();
      const existing = document.getElementById(
        "ymaps3-script",
      ) as HTMLScriptElement | null;
      console.log("🗺️ YandexMap: script present?", {
        exists: !!existing,
        src: existing?.src,
      });
      const allYandexScripts = Array.from(
        document.querySelectorAll('script[src*="api-maps.yandex.ru"]'),
      ) as HTMLScriptElement[];
      console.log(
        "🗺️ YandexMap: yandex scripts in DOM",
        allYandexScripts.map((s) => ({ id: s.id, src: s.src })),
      );
    } catch (e) {
      console.error("🗺️ YandexMap: ensure script error", e);
    }

    const loadMap = async () => {
      try {
        console.log("🗺️ YandexMap: Начинаем загрузку компонентов...");
        setError(null);
        setLoadingStep("Загрузка Yandex Maps API...");

        const components = await getYMapsReactComponents();
        console.log("🗺️ YandexMap: Компоненты загружены", {
          hasYMap: !!components?.YMap,
          hasScheme: !!components?.YMapDefaultSchemeLayer,
        });

        setLoadingStep("Инициализация компонентов...");
        setMapComponents(components);
        setIsLoaded(true);
        setLoadingStep("Готово!");

        console.log("🗺️ YandexMap: Карта успешно инициализирована");
      } catch (error) {
        console.error("🗺️ YandexMap: Ошибка загрузки:", error);
        setError(error instanceof Error ? error.message : "Неизвестная ошибка");
        setLoadingStep("Ошибка загрузки");
      }
    };

    loadMap();
  }, []);

  // Auto geolocation effect
  useEffect(() => {
    if (autoGeolocation && isLoaded && !currentLocation) {
      handleGetCurrentLocation();
    }
  }, [autoGeolocation, isLoaded, currentLocation]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.warn("🗺️ Геолокация не поддерживается браузером");
      return;
    }

    setGeolocationLoading(true);
    setLoadingStep("Определение местоположения...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        console.log("🗺️ YandexMap: геолокация получена", newLocation);
        setCurrentLocation(newLocation);
        setMapCenter(newLocation);
        setGeolocationLoading(false);
        setLoadingStep("Готово!");

        // Update map center
        if (mapRef.current) {
          try {
            mapRef.current.update?.({
              location: { center: newLocation, zoom: 14, duration: 500 },
            });
          } catch (e) {
            console.warn("🗺️ YandexMap: map.update failed", e);
          }
        }

        // Notify parent component about geolocation success
        if (onGeolocationSuccess) {
          onGeolocationSuccess(newLocation);
        }
      },
      (error) => {
        console.error("🗺️ YandexMap: ошибка геолокации", error);
        setGeolocationLoading(false);
        setLoadingStep("Готово!");

        // Use default center if geolocation fails
        if (!center) {
          setMapCenter([37.618423, 55.751244]); // Moscow default
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handleGeolocationSuccess = (position: any) => {
    const coords: [number, number] = [position.lng, position.lat];
    console.log("🗺️ YandexMap: YMapGeolocationControl success", coords);
    setCurrentLocation(coords);
    setMapCenter(coords);

    if (onGeolocationSuccess) {
      onGeolocationSuccess(coords);
    }
  };

  const handleGeolocationError = () => {
    console.error("🗺️ YandexMap: YMapGeolocationControl error");
  };

  // Always call hooks before any conditional returns
  // Recenter map when markers change
  useEffect(() => {
    if (!mapRef.current || !markers || markers.length === 0) return;
    const [lng, lat] = markers[0];
    try {
      console.log("🗺️ YandexMap: recenter to marker", { lng, lat });
      mapRef.current.update?.({
        location: { center: [lng, lat], zoom: 14, duration: 300 },
      });
    } catch (e) {
      console.warn("🗺️ YandexMap: map.update failed", e);
    }
  }, [markers]);

  const handleMapClick = async (event: any) => {
    try {
      console.log("🗺️ YandexMap: Клик по карте. keys:", Object.keys(event || {}));

      // Если это клик по маркеру, игнорируем
      if (event?.type === "marker") {
        console.log("🗺️ YandexMap: игнорируем клик по маркеру");
        return;
      }

      const coords = (event &&
        (event.coordinates || event?.coords || event?.position)) as
        | [number, number]
        | undefined;
      if (!coords) {
        console.warn("🗺️ YandexMap: координаты клика не найдены", event);
        return;
      }

      // Если preventClickSelection = true, показываем временный маркер
      if (preventClickSelection) {
        console.log("🗺️ YandexMap: показываем временный маркер", coords);
        setClickedLocation(coords);
      } else if (onLocationSelect) {
        console.log("🗺️ YandexMap: onLocationSelect", coords);
        onLocationSelect(coords);
      }
    } catch (e) {
      console.error("🗺️ YandexMap: ошибка обработки клика", e);
    }
  };

  const handleSelectClickedLocation = () => {
    if (clickedLocation && onLocationSelect) {
      console.log("🗺️ YandexMap: выбираем кликнутое место", clickedLocation);
      onLocationSelect(clickedLocation);
      setClickedLocation(null);
    }
  };

  // Подготавливаем маркеры с расстояниями
  const prepareMarkersWithDistances = (): MarkerWithDistance[] => {
    const allMarkers: MarkerWithDistance[] = [];

    // Добавляем обычные маркеры
    markers.forEach((coords) => {
      const distance =
        currentLocation && showDistances
          ? calculateDistanceFromCoords(currentLocation, coords)
          : undefined;
      allMarkers.push({ coordinates: coords, distance });
    });

    // Добавляем маркеры с дополнительной информацией
    markersWithInfo.forEach((marker) => {
      const distance =
        currentLocation && showDistances
          ? calculateDistanceFromCoords(currentLocation, marker.coordinates)
          : marker.distance;
      allMarkers.push({ ...marker, distance });
    });

    return allMarkers;
  };

  const markersToRender = prepareMarkersWithDistances();

  console.log("🗺️ YandexMap: Рендер", {
    isLoaded,
    hasComponents: !!mapComponents,
    error,
  });

  if (error) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center border border-red-200 bg-red-50`}
      >
        <div className="text-center text-red-600">
          <div className="font-medium">Ошибка загрузки карты</div>
          <div className="mt-1 text-sm">{error}</div>
          <div className="mt-2 text-xs text-gray-500">{loadingStep}</div>
        </div>
      </div>
    );
  }

  if (!isLoaded || !mapComponents) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center bg-gray-100`}
      >
        <div className="text-gray-500">
          {geolocationLoading ? "Определение местоположения..." : "Загрузка карты..."}
        </div>
        <div className="mt-1 text-xs text-gray-400">{loadingStep}</div>
      </div>
    );
  }

  const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapListener,
    YMapMarker,
    YMapControls,
    YMapGeolocationControl,
    reactify,
  } = mapComponents;

  return (
    <div className={`${className} relative`}>
      <YMap
        ref={mapRef}
        location={reactify.useDefault({
          center: mapCenter,
          zoom,
        })}
        mode="vector"
      >
        <YMapDefaultSchemeLayer />
        <YMapDefaultFeaturesLayer />

        {/* Controls with geolocation */}
        {enableGeolocation && YMapControls && YMapGeolocationControl && (
          <YMapControls position="right">
            <YMapGeolocationControl
              onGeolocatePosition={handleGeolocationSuccess}
              onGeolocateError={handleGeolocationError}
              zoom={14}
              duration={500}
              positionOptions={{
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
              }}
            />
          </YMapControls>
        )}

        {/* Current location marker */}
        {currentLocation && (
          <YMapMarker coordinates={currentLocation}>
            <div
              style={{
                width: 12,
                height: 12,
                background: "#007AFF",
                border: "2px solid white",
                borderRadius: "50%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            />
          </YMapMarker>
        )}

        {/* Temporary clicked location marker */}
        {clickedLocation && (
          <YMapMarker coordinates={clickedLocation}>
            <div className="relative">
              <div
                style={{
                  width: 14,
                  height: 14,
                  background: "#FF6B6B",
                  border: "2px solid white",
                  borderRadius: "50%",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  cursor: "pointer",
                }}
              />
              {currentLocation && showDistances && (
                <div
                  className="absolute top-4 left-1/2 z-10 -translate-x-1/2 transform rounded bg-red-50 px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
                  style={{
                    fontSize: "11px",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                  }}
                >
                  {formatDistance(
                    calculateDistanceFromCoords(currentLocation, clickedLocation),
                  )}
                  <div className="text-xs text-red-400">от вас</div>
                </div>
              )}
            </div>
          </YMapMarker>
        )}

        {/* Markers with distances */}
        {markersToRender.map((marker, idx) => (
          <YMapMarker key={`marker-${idx}`} coordinates={marker.coordinates}>
            <div className="relative">
              <div
                onClick={(e) => {
                  e.stopPropagation(); // Предотвращаем всплытие события к карте
                  if (marker.onClick) {
                    console.log("🟣 YandexMap: маркер кликнут", marker);
                    marker.onClick();
                  }
                }}
                style={{
                  width: 12,
                  height: 12,
                  background: "#9924FF",
                  borderRadius: "50%",
                  border: "2px solid white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  cursor: marker.onClick ? "pointer" : "default",
                }}
              />
              {marker.distance !== undefined && showDistances && (
                <div
                  className="absolute top-4 left-1/2 z-10 -translate-x-1/2 transform rounded bg-white px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
                  style={{
                    fontSize: "11px",
                    color: "#333",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {formatDistance(marker.distance)}
                  {marker.label && (
                    <div className="mt-1 text-xs text-gray-500">{marker.label}</div>
                  )}
                </div>
              )}
            </div>
          </YMapMarker>
        ))}
        <YMapListener onClick={handleMapClick} />
      </YMap>

      {/* Select button for clicked location */}
      {clickedLocation && showSelectButton && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
          <div className="flex gap-2">
            <button
              onClick={handleSelectClickedLocation}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-blue-600"
            >
              Выбрать это место
            </button>
            <button
              onClick={() => setClickedLocation(null)}
              className="rounded-lg bg-gray-500 px-3 py-2 text-sm text-white shadow-lg hover:bg-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
