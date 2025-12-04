import { useMemo } from "react";
import { Event } from "~/db/schema";
import { useEventsCache } from "./useEventsCache";

interface UseFilteredEventsOptions {
  category?: string;
  search?: string;
  priceRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  location?: string;
  type?: string;
  organizer?: string;
  isSeries?: boolean;
  hasAchievement?: string;
  sortBy?: string;
}

export const sortEvents = (events: any[], sortBy?: string) => {
  if (!sortBy) return events;

  return [...events].sort((a, b) => {
    switch (sortBy) {
      case "Сначала новые":
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case "Сначала старые":
        return (
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      case "Сначала дешевле":
        return (a.price || 0) - (b.price || 0);
      case "Сначала дороже":
        return (b.price || 0) - (a.price || 0);
      default:
        return 0;
    }
  });
};

export const filterEvent = (event: any, options: UseFilteredEventsOptions) => {
  const {
    category,
    search,
    priceRange,
    dateRange,
    location,
    type,
    organizer,
    isSeries,
    hasAchievement,
  } = options;

  // Фильтр по категории
  if (category && category !== "Все" && event.category !== category) {
    return false;
  }

  // Фильтр по городу
  if (
    location &&
    location !== "Все" &&
    event.location !== location &&
    event.city !== location
  ) {
    return false;
  }

  // Фильтр по типу
  if (type && type !== "Все" && event.type !== type) {
    return false;
  }

  // Фильтр по организатору
  if (organizer && organizer !== "Все" && event.organizer !== organizer) {
    return false;
  }

  // Фильтр по серии квестов
  if (isSeries && !event.isSeries) {
    return false;
  }

  // Фильтр по наличию достижения
  if (hasAchievement && hasAchievement !== "Все") {
    const hasAchiev = hasAchievement === "Да";
    if (!!event.hasAchievement !== hasAchiev) return false;
  }

  // Поиск по тексту
  if (search) {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (event.title?.toLowerCase() || "").includes(searchLower) ||
      (event.description?.toLowerCase() || "").includes(searchLower) ||
      (event.location?.toLowerCase() || "").includes(searchLower) ||
      (event.organizer?.toLowerCase() || "").includes(searchLower);
    if (!matchesSearch) return false;
  }

  // Фильтр по цене
  if (priceRange) {
    if (
      event.price === null ||
      event.price < priceRange.min ||
      event.price > priceRange.max
    ) {
      return false;
    }
  }

  // Фильтр по дате
  if (dateRange && event.date) {
    const eventDate = new Date(event.date);
    if (eventDate < dateRange.start || eventDate > dateRange.end) {
      return false;
    }
  }

  return true;
};

export const useFilteredEvents = (options: UseFilteredEventsOptions = {}) => {
  const { events, isLoading, error } = useEventsCache();

  // Фильтруем события
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => filterEvent(event, options));
    return sortEvents(filtered, options.sortBy);
  }, [events, options]);

  // Группируем по категориям для быстрого доступа
  const eventsByCategory = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    events.forEach((event) => {
      if (event.category) {
        if (!grouped[event.category]) {
          grouped[event.category] = [];
        }
        grouped[event.category].push(event);
      }
    });
    return grouped;
  }, [events]);

  return {
    events: filteredEvents,
    allEvents: events,
    eventsByCategory,
    isLoading,
    error,
    totalCount: events.length,
    filteredCount: filteredEvents.length,
  };
};
