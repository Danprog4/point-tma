import { useMemo } from "react";
import { Meet } from "~/db/schema";

interface UseFilteredMeetingsOptions {
  category?: string;
  type?: string;
  search?: string;
  maxParticipants?: number;
  sortBy?: string;
}

export const sortMeetings = (meetings: any[], sortBy?: string) => {
  if (!sortBy) return meetings;

  return [...meetings].sort((a, b) => {
    switch (sortBy) {
      case "Сначала новые":
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case "Сначала старые":
        return (
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      default:
        return 0;
    }
  });
};

export const filterMeeting = (
  meeting: any,
  options: UseFilteredMeetingsOptions,
) => {
  const { category, type, search, maxParticipants } = options;

  // Фильтр по категории (в БД это type)
  if (category && category !== "Все" && meeting.type !== category) {
    return false;
  }

  // Фильтр по типу (в БД это subType)
  if (type && type !== "Все" && meeting.subType !== type) {
    return false;
  }

  // Поиск по тексту
  if (search) {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      (meeting.name?.toLowerCase() || "").includes(searchLower) ||
      (meeting.description?.toLowerCase() || "").includes(searchLower) ||
      (meeting.user?.name?.toLowerCase() || "").includes(searchLower);
    if (!matchesSearch) return false;
  }

  // Фильтр по количеству участников
  if (maxParticipants && meeting.maxParticipants) {
    if (meeting.maxParticipants > maxParticipants) {
      return false;
    }
  }

  return true;
};

export const useFilteredMeetings = (
  meetings: any[],
  options: UseFilteredMeetingsOptions = {},
) => {
  // Фильтруем встречи
  const filteredMeetings = useMemo(() => {
    const filtered = meetings.filter((meeting) =>
      filterMeeting(meeting, options),
    );
    return sortMeetings(filtered, options.sortBy);
  }, [meetings, options]);

  return {
    meetings: filteredMeetings,
    totalCount: meetings.length,
    filteredCount: filteredMeetings.length,
  };
};

