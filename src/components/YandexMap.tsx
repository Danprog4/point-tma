import React, { useEffect, useRef, useState } from "react";
import { getYMapsReactComponents, loadYMapsScript } from "~/lib/ymaps";

interface YandexMapProps {
  center: [number, number];
  zoom?: number;
  onLocationSelect?: (coordinates: [number, number], address?: string) => void;
  className?: string;
  markers?: Array<[number, number]>;
}

export const YandexMap: React.FC<YandexMapProps> = ({
  center,
  zoom = 10,
  onLocationSelect,
  className = "w-full h-64 rounded-lg",
  markers = [],
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("Инициализация...");
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
      const coords = (event &&
        (event.coordinates || event?.coords || event?.position)) as
        | [number, number]
        | undefined;
      if (!coords) {
        console.warn("🗺️ YandexMap: координаты клика не найдены", event);
        return;
      }
      if (onLocationSelect) {
        console.log("🗺️ YandexMap: onLocationSelect", coords);
        onLocationSelect(coords);
      }
    } catch (e) {
      console.error("🗺️ YandexMap: ошибка обработки клика", e);
    }
  };

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
        <div className="text-gray-500">Загрузка карты...</div>
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
    reactify,
  } = mapComponents;

  return (
    <div className={className}>
      <YMap
        ref={mapRef}
        location={reactify.useDefault({
          center,
          zoom,
        })}
        mode="vector"
      >
        <YMapDefaultSchemeLayer />
        <YMapDefaultFeaturesLayer />
        {Array.isArray(markers) &&
          markers.map((m, idx) => (
            <YMapMarker key={idx} coordinates={m}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: "#9924FF",
                  borderRadius: 9999,
                }}
              />
            </YMapMarker>
          ))}
        <YMapListener onClick={handleMapClick} />
      </YMap>
    </div>
  );
};
