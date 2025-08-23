import React from "react";
import ReactDOM from "react-dom";

declare global {
  interface Window {
    ymaps3: any;
  }
}

let ymapsPromise: Promise<any> | null = null;

const YM_SCRIPT_ID = "ymaps3-script";
const API_KEY = (import.meta.env as any)?.VITE_YANDEX_MAPS_API_KEY;
const YM_SCRIPT_SRC = `https://api-maps.yandex.ru/v3/?apikey=${API_KEY}&lang=ru_RU`;

function ensureScriptTag(): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(YM_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (!existing.src) existing.src = YM_SCRIPT_SRC;
    console.log("🗺️ ensureScriptTag: existing script found", {
      id: existing.id,
      src: existing.src,
    });
    return;
  }
  const script = document.createElement("script");
  script.id = YM_SCRIPT_ID;
  script.src = YM_SCRIPT_SRC;
  script.async = true;
  script.onload = () => console.log("🗺️ ymaps3 script loaded");
  script.onerror = (e) => console.error("🗺️ ymaps3 script failed to load", e);
  console.log("🗺️ injecting ymaps3 script", { src: script.src });
  document.head.appendChild(script);
}

export function loadYMapsScript() {
  try {
    ensureScriptTag();
  } catch (e) {
    console.error("🗺️ loadYMapsScript error", e);
  }
}

export const initYMaps = async () => {
  if (ymapsPromise) {
    return ymapsPromise;
  }

  ymapsPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("ymaps3 can only be used in browser"));
      return;
    }

    try {
      console.log("🗺️ initYMaps: starting", {
        hasWindow: typeof window !== "undefined",
        hasYmaps3: !!window.ymaps3,
        scriptInDom: !!document.getElementById(YM_SCRIPT_ID),
        apiKeyUsed: API_KEY ? API_KEY.slice(0, 6) + "***" : null,
      });
    } catch {}

    if (!window.ymaps3) {
      ensureScriptTag();
    }

    if (window.ymaps3) {
      console.log("🗺️ initYMaps: ymaps3 already available");
      resolve(window.ymaps3);
      return;
    }

    const startedAt = Date.now();
    const timeoutMs = 10000; // 10s hard timeout
    const checkYmaps = () => {
      if (window.ymaps3) {
        console.log("🗺️ initYMaps: ymaps3 detected");
        resolve(window.ymaps3);
      } else {
        const scripts = Array.from(
          document.querySelectorAll('script[src*="api-maps.yandex.ru"]'),
        ) as HTMLScriptElement[];
        console.log("🗺️ initYMaps: waiting...", {
          scripts: scripts.map((s) => ({ id: s.id, src: s.src })),
          hasYmaps3: !!(window as any).ymaps3,
        });
        if (Date.now() - startedAt > timeoutMs) {
          console.error("🗺️ initYMaps: timeout waiting for ymaps3");
          reject(new Error("Timeout waiting for ymaps3 to load"));
          return;
        }
        setTimeout(checkYmaps, 300);
      }
    };

    checkYmaps();
  });

  return ymapsPromise;
};

export const getYMapsReactComponents = async () => {
  const ymaps3 = await initYMaps();
  await ymaps3.ready;

  console.log("🗺️ ymaps.ts: Начинаем загрузку компонентов", {
    hasYmaps3: !!ymaps3,
    ymaps3Keys: Object.keys(ymaps3),
  });

  const [ymaps3React, ymaps3Controls] = await Promise.all([
    ymaps3.import("@yandex/ymaps3-reactify"),
    ymaps3.import("@yandex/ymaps3-controls").catch(() => null), // Fallback if controls not available
    ymaps3.ready,
  ]);

  console.log("🗺️ ymaps.ts: Импорты завершены", {
    hasYmaps3React: !!ymaps3React,
    hasYmaps3Controls: !!ymaps3Controls,
  });

  const reactify = ymaps3React.reactify.bindTo(React, ReactDOM);

  const components = {
    YMap: reactify.module(ymaps3).YMap,
    YMapDefaultSchemeLayer: reactify.module(ymaps3).YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer: reactify.module(ymaps3).YMapDefaultFeaturesLayer,
    YMapListener: reactify.module(ymaps3).YMapListener,
    YMapMarker: reactify.module(ymaps3).YMapMarker,
    YMapControls: null,
    YMapGeolocationControl: null,
    YMapClusterer: null,
    clusterByGrid: null as any,
    reactify,
  };

  // Add controls if available
  if (ymaps3Controls) {
    components.YMapControls = reactify.module(ymaps3Controls).YMapControls;
    components.YMapGeolocationControl =
      reactify.module(ymaps3Controls).YMapGeolocationControl;
  }

  // Load clusterer exactly as in the documentation example
  try {
    console.log("🗺️ ymaps.ts: Загружаем кластеризацию через динамический ES импорт");

    // Load the package with the cluster using dynamic ES import (like in the example)
    const ymaps3Clusterer = await import("@yandex/ymaps3-clusterer");

    console.log("🗺️ ymaps.ts: Кластеризация загружена через ES импорт", {
      hasYMapClusterer: !!ymaps3Clusterer.YMapClusterer,
      hasClusterByGrid: !!ymaps3Clusterer.clusterByGrid,
      YMapClustererType: typeof ymaps3Clusterer.YMapClusterer,
      clusterByGridType: typeof ymaps3Clusterer.clusterByGrid,
      clustererKeys: Object.keys(ymaps3Clusterer),
    });

    // Apply reactify to clusterer components (exactly like in the example)
    const { YMapClusterer, clusterByGrid } = reactify.module(ymaps3Clusterer);

    console.log("🗺️ ymaps.ts: Компоненты кластеризации добавлены", {
      hasYMapClusterer: !!components.YMapClusterer,
      hasClusterByGrid: !!components.clusterByGrid,
    });

    components.YMapClusterer = YMapClusterer;
    components.clusterByGrid = clusterByGrid;
  } catch (error) {
    console.error("🗺️ ymaps.ts: Ошибка загрузки кластеризации:", error);
    console.warn("🗺️ ymaps.ts: Кластеризация НЕ найдена!");
  }

  console.log("🗺️ ymaps.ts: Финальные компоненты", {
    finalKeys: Object.keys(components),
    hasYMapClusterer: !!components.YMapClusterer,
    hasClusterByGrid: !!components.clusterByGrid,
  });

  return components;
};
