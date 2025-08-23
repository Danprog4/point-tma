import { MapPin as PinIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateDistanceFromCoords,
  formatDistance,
} from "~/lib/utils/calculateDistance";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { getYMapsReactComponents, loadYMapsScript } from "~/lib/ymaps";

interface MarkerWithDistance {
  coordinates: [number, number];
  distance?: number;
  label?: string;
  onClick?: () => void;
  meetData?: any;
  userPhoto?: string;
  color?: string; // Custom color for the marker
  participantsCount?: number; // Количество встреч в этом месте (для множественных встреч)
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
  enableClustering?: boolean; // Включить кластеризацию маркеров
  clusterGridSize?: number; // Размер сетки для кластеризации в пикселях
  userPhoto?: string;
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
  enableClustering = false,
  clusterGridSize = 60,
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
  const [clusterComponents, setClusterComponents] = useState<any>(null);
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

  // Загружаем компоненты кластеризации если включена
  useEffect(() => {
    console.log("🗺️ YandexMap: useEffect для кластеризации", {
      enableClustering,
      isLoaded,
      hasMapComponents: !!mapComponents,
      mapComponentsKeys: mapComponents ? Object.keys(mapComponents) : null,
      // Детальное логирование содержимого
      mapComponentsDetails: mapComponents
        ? {
            hasYMap: !!mapComponents.YMap,
            hasYMapClusterer: !!mapComponents.YMapClusterer,
            hasClusterByGrid: !!mapComponents.clusterByGrid,
            YMapClustererType: typeof mapComponents.YMapClusterer,
            clusterByGridType: typeof mapComponents.clusterByGrid,
          }
        : null,
    });

    if (enableClustering && isLoaded && mapComponents) {
      const loadClusterComponents = async () => {
        try {
          console.log("🗺️ YandexMap: Загружаем компоненты кластеризации", {
            hasYMapClusterer: !!mapComponents.YMapClusterer,
            hasClusterByGrid: !!mapComponents.clusterByGrid,
            clusterByGridType: typeof mapComponents.clusterByGrid,
            // Проверим все ключи
            allKeys: Object.keys(mapComponents),
            // Проверим конкретные компоненты
            YMapClusterer: mapComponents.YMapClusterer,
            clusterByGrid: mapComponents.clusterByGrid,
          });

          // Проверяем, есть ли уже компоненты кластеризации в mapComponents
          if (mapComponents.YMapClusterer && mapComponents.clusterByGrid) {
            setClusterComponents({
              YMapClusterer: mapComponents.YMapClusterer,
              clusterByGrid: mapComponents.clusterByGrid,
            });
            console.log("🗺️ YandexMap: Компоненты кластеризации установлены");
          } else {
            console.warn(
              "🗺️ YandexMap: Компоненты кластеризации НЕ найдены в mapComponents",
            );
            console.log(
              "🗺️ YandexMap: Доступные компоненты:",
              Object.keys(mapComponents),
            );
          }
        } catch (error) {
          console.error("🗺️ YandexMap: Ошибка загрузки кластеризации:", error);
        }
      };
      loadClusterComponents();
    } else if (!enableClustering) {
      // Сбрасываем компоненты кластеризации если она отключена
      setClusterComponents(null);
      console.log("🗺️ YandexMap: Кластеризация отключена, сбрасываем компоненты");
    }
  }, [enableClustering, isLoaded, mapComponents]);

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

  // Создаем метод кластеризации с useMemo для оптимизации (как в примере)
  const gridSizedMethod = useMemo(() => {
    if (clusterComponents?.clusterByGrid) {
      return clusterComponents.clusterByGrid({ gridSize: 128 });
    }
    return null;
  }, [clusterComponents]);

  // Функция для рендеринга маркеров - используем YMapDefaultMarker как в примере
  const marker = (feature: any) => {
    const markerData = feature.properties.marker;
    const idx = feature.properties.idx;

    return (
      <YMapMarker key={`marker-${idx}`} coordinates={markerData.coordinates}>
        <div
          className="relative"
          onClick={(e) => {
            e.stopPropagation();
            markerData.onClick?.();
          }}
          style={{
            width: markerData.userPhoto ? 40 : 28,
            height: markerData.userPhoto ? 40 : 28,
            minWidth: markerData.userPhoto ? 40 : 28,
            minHeight: markerData.userPhoto ? 40 : 28,
          }}
        >
          <div
            style={{
              transform: "translate(-50%, -100%)",
              position: "relative",
              left: 0,
              top: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: markerData.onClick ? "pointer" : "default",
              width: markerData.userPhoto ? 40 : "auto",
              height: markerData.userPhoto ? 40 : "auto",
            }}
          >
            {markerData.userPhoto ? (
              <img
                src={getImageUrl(markerData.userPhoto)}
                alt="User"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "10%",
                  border: "3px solid white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  objectFit: "cover",
                  zIndex: 1000,
                }}
                onLoad={() => {
                  console.log(`✅ Image loaded for marker ${idx}:`, markerData.userPhoto);
                }}
                onError={(e) =>
                  console.error(
                    `❌ Image failed to load for marker ${idx}:`,
                    markerData.userPhoto,
                    e,
                  )
                }
              />
            ) : (
              <>
                <PinIcon size={28} color={markerData.color || "#9924FF"} />
                {markerData.participantsCount && markerData.participantsCount > 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      right: -4,
                      bottom: -4,
                      width: 18,
                      height: 18,
                      borderRadius: 9999,
                      background: markerData.color || "#9924FF",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      pointerEvents: "none",
                    }}
                  >
                    {markerData.participantsCount}
                  </div>
                ) : null}
              </>
            )}
          </div>
          {markerData.distance !== undefined && showDistances && (
            <div
              className="absolute left-1/2 z-10 -translate-x-1/2 transform rounded bg-white px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
              style={{
                fontSize: "11px",
                color: "#333",
                border: "1px solid #e0e0e0",
                top: 4,
                pointerEvents: "none",
              }}
            >
              {formatDistance(markerData.distance)}
              {markerData.label && (
                <div className="mt-1 text-xs text-gray-500">{markerData.label}</div>
              )}
            </div>
          )}
        </div>
      </YMapMarker>
    );
  };

  // Функция для рендеринга кластеров - точно как в примере
  const cluster = (coordinates: [number, number], features: any[]) => {
    const handleClusterClick = () => {
      // Приближаем карту к области кластера
      if (mapRef.current?.update) {
        // Вычисляем границы кластера
        const lats = features.map((f) => f.geometry.coordinates[1]);
        const lngs = features.map((f) => f.geometry.coordinates[0]);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Добавляем небольшой отступ
        const padding = 0.01;

        mapRef.current.update({
          location: {
            bounds: [
              [minLng - padding, minLat - padding],
              [maxLng + padding, maxLat + padding],
            ],
            duration: 500,
          },
        });
      }
    };

    return (
      <YMapMarker coordinates={coordinates}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "#4a90e2",
            border: "3px solid white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
          }}
          onClick={handleClusterClick}
        >
          {features.length}
        </div>
      </YMapMarker>
    );
  };

  const markersToRender = prepareMarkersWithDistances();

  // Проверяем, что компоненты загружены перед деструктуризацией
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
    YMapClusterer,
    reactify,
  } = mapComponents;

  // Подготавливаем location для карты
  const mapLocation = reactify.useDefault({
    center: mapCenter,
    zoom,
  });

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

  return (
    <div className={`${className} relative`}>
      <YMap ref={mapRef} location={mapLocation} mode="vector">
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
        {(() => {
          console.log("🗺️ YandexMap: Проверяем условия для кластеризации", {
            enableClustering,
            hasClusterComponents: !!clusterComponents,
            clusterComponentsKeys: clusterComponents
              ? Object.keys(clusterComponents)
              : null,
            markersCount: markersToRender.length,
          });

          if (enableClustering && clusterComponents) {
            console.log("🗺️ YandexMap: Рендерим кластеризацию", {
              hasClusterComponents: !!clusterComponents,
              YMapClusterer: !!clusterComponents.YMapClusterer,
              clusterByGrid: !!clusterComponents.clusterByGrid,
              markersCount: markersToRender.length,
              features: markersToRender.map((marker, idx) => ({
                type: "Feature",
                id: idx,
                geometry: { coordinates: marker.coordinates },
                properties: { marker, idx },
              })),
            });

            return (
              <YMapClusterer
                method={gridSizedMethod}
                features={markersToRender.map((marker, idx) => ({
                  type: "Feature",
                  id: idx,
                  geometry: { coordinates: marker.coordinates },
                  properties: { marker, idx },
                }))}
                marker={marker}
                cluster={cluster}
              />
            );
          } else {
            console.log(
              "🗺️ YandexMap: Рендерим обычные маркеры (кластеризация отключена или недоступна)",
            );
            return markersToRender.map((marker, idx) => {
              // Debug logging for userPhoto
              console.log(`🗺️ Rendering marker ${idx}:`, {
                hasUserPhoto: !!marker.userPhoto,
                userPhoto: marker.userPhoto,
                coordinates: marker.coordinates,
                label: marker.label,
              });

              return (
                <YMapMarker key={`marker-${idx}`} coordinates={marker.coordinates}>
                  <div
                    className="relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      marker.onClick?.();
                    }}
                    style={{
                      width: marker.userPhoto ? 40 : 28, // Адаптируем размер под содержимое
                      height: marker.userPhoto ? 40 : 28, // Адаптируем размер под содержимое
                      minWidth: marker.userPhoto ? 40 : 28, // Минимальная ширина
                      minHeight: marker.userPhoto ? 40 : 28, // Минимальная высота
                    }}
                  >
                    <div
                      style={{
                        transform: "translate(-50%, -100%)",
                        position: "relative",
                        left: 0,
                        top: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: marker.onClick ? "pointer" : "default",
                        width: marker.userPhoto ? 40 : "auto", // Адаптируем размер
                        height: marker.userPhoto ? 40 : "auto", // Адаптируем размер
                      }}
                    >
                      {marker.userPhoto ? (
                        <img
                          src={getImageUrl(marker.userPhoto)}
                          alt="User"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "10%",
                            border: "3px solid white",
                            boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                            display: "block",
                            objectFit: "cover",
                            zIndex: 1000,
                          }}
                          onLoad={() => {
                            console.log(
                              `✅ Image loaded for marker ${idx}:`,
                              marker.userPhoto,
                            );
                            console.log(`🖼️ Image element for marker ${idx}:`, {
                              src: marker.userPhoto
                                ? getImageUrl(marker.userPhoto)
                                : "undefined",
                              width: 40,
                              height: 40,
                              style: {
                                display: "block",
                                objectFit: "cover",
                                zIndex: 1000,
                              },
                            });
                          }}
                          onError={(e) =>
                            console.error(
                              `❌ Image failed to load for marker ${idx}:`,
                              marker.userPhoto,
                              e,
                            )
                          }
                        />
                      ) : (
                        <>
                          <PinIcon
                            size={28}
                            strokeWidth={2.25}
                            color={marker.color || "#9924FF"}
                          />
                        </>
                      )}
                    </div>
                    {marker.distance !== undefined && showDistances && (
                      <div
                        className="absolute left-1/2 z-10 -translate-x-1/2 transform rounded bg-white px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg"
                        style={{
                          fontSize: "11px",
                          color: "#333",
                          border: "1px solid #e0e0e0",
                          top: 4,
                          pointerEvents: "none",
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
              );
            });
          }
        })()}
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
