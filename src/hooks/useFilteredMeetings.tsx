import { useMemo } from "react";

interface UseFilteredMeetingsOptions {
  category?: string;
  type?: string;
  search?: string;
  maxParticipants?: number;
  sortBy?: string;
  time?: string;
  date?: Date;
  city?: string;
}

export const sortMeetings = (meetings: any[], sortBy?: string) => {
  if (!sortBy) return meetings;

  return [...meetings].sort((a, b) => {
    switch (sortBy) {
      case "По дате: новые сначала":
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      case "По дате: старые сначала":
        return (
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
      default:
        return 0;
    }
  });
};

export const filterMeeting = (meeting: any, options: UseFilteredMeetingsOptions) => {
  const { category, type, search, maxParticipants, time, date, city } = options;

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

  // Фильтр по времени (формат HH:MM)
  if (time && meeting.time) {
    if (meeting.time !== time) {
      return false;
    }
  }

  // Фильтр по дате (формат DD.MM.YYYY)
  if (date) {
    if (!meeting.date) return false;

    // Форматируем дату фильтра в строку DD.MM.YYYY
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const filterDateString = `${day}.${month}.${year}`;

    // Если meeting.date это строка DD.MM.YYYY
    if (typeof meeting.date === "string" && meeting.date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      if (meeting.date !== filterDateString) return false;
    } else {
      // Пытаемся распарсить как Date объект или другую строку
      const meetingDate = new Date(meeting.date);
      // Проверяем валидность даты
      if (!isNaN(meetingDate.getTime())) {
        if (
          meetingDate.getDate() !== date.getDate() ||
          meetingDate.getMonth() !== date.getMonth() ||
          meetingDate.getFullYear() !== date.getFullYear()
        ) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  // Фильтр по городу
  // city: [{"address":"Москва","endtime":"","isCustom":false,"location":"GOKON — Большой GOKON (VIP)","starttime":""}]
  // meeting.city может быть строкой или массивом locations
  if (city && city !== "Все") {
    // Проверяем meeting.city (если это строка)
    if (typeof meeting.city === "string" && meeting.city === city) {
      // совпадение найдено
    } else if (meeting.locations && Array.isArray(meeting.locations)) {
      // Проверяем массив locations
      const hasCity = meeting.locations.some((loc: any) => {
        // Парсим адрес или ищем совпадение в адресе
        return (loc.address || "").includes(city);
      });
      if (!hasCity) return false;
    } else {
      // Если ни meeting.city не совпал, ни в locations не нашли
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
    const filtered = meetings.filter((meeting) => filterMeeting(meeting, options));
    return sortMeetings(filtered, options.sortBy);
  }, [meetings, options]);

  return {
    meetings: filteredMeetings,
    totalCount: meetings.length,
    filteredCount: filteredMeetings.length,
  };
};
