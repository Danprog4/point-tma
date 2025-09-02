import { useMemo } from "react";
import { Event } from "~/db/schema";
import { useEventsCache } from "./useEventsCache";

interface UseFilteredEventsOptions {
  category?: string;
  search?: string;
  priceRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
}

export const useFilteredEvents = (options: UseFilteredEventsOptions = {}) => {
  const { category, search, priceRange, dateRange } = options;

  const { events, isLoading, error } = useEventsCache();

  // Фильтруем события
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Фильтр по категории
    if (category && category !== "Все") {
      filtered = filtered.filter((event) => event.category === category);
    }

    // Поиск по тексту
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          (event.title?.toLowerCase() || "").includes(searchLower) ||
          (event.description?.toLowerCase() || "").includes(searchLower) ||
          (event.location?.toLowerCase() || "").includes(searchLower) ||
          (event.organizer?.toLowerCase() || "").includes(searchLower),
      );
    }

    // Фильтр по цене
    if (priceRange) {
      filtered = filtered.filter(
        (event) =>
          event.price && event.price >= priceRange.min && event.price <= priceRange.max,
      );
    }

    // Фильтр по дате
    if (dateRange) {
      filtered = filtered.filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return eventDate >= dateRange.start && eventDate <= dateRange.end;
      });
    }

    return filtered;
  }, [events, category, search, priceRange, dateRange]);

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
