import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Event } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";

interface EventsCache {
  events: Event[];
  lastUpdated: number;
  version: string;
  checksum: string;
}

interface UseEventsCacheOptions {
  cacheKey?: string; // Ключ для localStorage
  forceRefresh?: boolean; // Принудительное обновление
}

export const useEventsCache = (options: UseEventsCacheOptions = {}) => {
  const { cacheKey = "events-cache", forceRefresh = false } = options;

  const trpc = useTRPC();

  // Кэш в localStorage
  const [cache, setCache] = useLocalStorage<EventsCache>(cacheKey, {
    events: [],
    lastUpdated: 0,
    version: "1.0",
    checksum: "",
  });

  // Проверяем, есть ли данные в кэше
  const hasCachedData = cache.events.length > 0;

  // ВСЕГДА делаем запрос при заходе в приложение, но показываем кэш пока загружаются новые данные
  const shouldUseCache = hasCachedData && !forceRefresh;

  // Основной запрос к API - делаем ВСЕГДА при заходе в приложение
  const {
    data: freshEvents,
    isLoading,
    error,
  } = useQuery({
    ...trpc.event.getEvents.queryOptions(),
    enabled: true, // Всегда делаем запрос
  });

  // Обновляем кэш при получении новых данных
  useEffect(() => {
    if (freshEvents && freshEvents.length > 0) {
      const newChecksum = generateChecksum(freshEvents);

      // Обновляем кэш только если данные действительно изменились
      if (newChecksum !== cache.checksum) {
        const newCache: EventsCache = {
          events: freshEvents,
          lastUpdated: Date.now(),
          version: cache.version,
          checksum: newChecksum,
        };
        setCache(newCache);
      }
    }
  }, [freshEvents, cache.checksum, setCache]);

  // Возвращаем данные: показываем кэш, пока загружаются новые
  const events = shouldUseCache ? cache.events : freshEvents || [];

  // Функция для очистки кэша
  const clearCache = () => {
    setCache({
      events: [],
      lastUpdated: 0,
      version: cache.version,
      checksum: "",
    });
  };

  const getEventById = (id: number, category: string) => {
    return events.find((event) => event.id === id && event.category === category);
  };

  return {
    events,
    isLoading: shouldUseCache ? false : isLoading, // Показываем загрузку только если нет кэша
    error,
    lastUpdated: cache.lastUpdated,
    clearCache,
    cacheSize: cache.events.length,
    getEventById,
  };
};

// Генерируем простой checksum для определения изменений
function generateChecksum(events: Event[]): string {
  const sortedEvents = [...events].sort((a, b) => a.id - b.id);
  const dataString = JSON.stringify(
    sortedEvents.map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      isApproved: e.isApproved,
      isReviewed: e.isReviewed,
    })),
  );

  // Простой хеш
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}
