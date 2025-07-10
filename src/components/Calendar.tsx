import { AnimatePresence } from "framer-motion";
import { Calendar1 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FullCalendar } from "./ui/calendar";
export const Calendar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const scrollRef = useRef<HTMLDivElement>(null);

  const months = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const weekdays = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

  const getAllDays = () => {
    const today = new Date();
    const days = [];

    for (let monthOffset = 0; monthOffset <= 6; monthOffset++) {
      const year = today.getFullYear();
      const month = today.getMonth() + monthOffset;

      const targetDate = new Date(year, month, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();

      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, targetMonth, day);

        if (monthOffset === 0 && day < today.getDate()) {
          continue;
        }

        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        days.push({
          day: day.toString(),
          weekday: weekdays[date.getDay()],
          isWeekend,
          date: new Date(date),
          month: targetMonth,
          year: targetYear,
        });
      }
    }

    return days;
  };

  const allDays = getAllDays();

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const dayWidth = 48 + 8;
      const visibleDayIndex = Math.round(
        (scrollLeft + scrollRef.current.clientWidth / 2) / dayWidth,
      );

      if (allDays[visibleDayIndex]) {
        const visibleDay = allDays[visibleDayIndex];
        if (visibleDay.month !== currentMonth || visibleDay.year !== currentYear) {
          setCurrentMonth(visibleDay.month);
          setCurrentYear(visibleDay.year);
        }
      }
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date();
      const todayIndex = allDays.findIndex(
        (day) =>
          day.date.getDate() === today.getDate() &&
          day.date.getMonth() === today.getMonth() &&
          day.date.getFullYear() === today.getFullYear(),
      );

      if (todayIndex !== -1) {
        const dayWidth = 48 + 8;
        const scrollPosition = todayIndex * dayWidth - scrollRef.current.clientWidth / 2;
        scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, [allDays]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="w-full overflow-x-hidden px-4">
      {isOpen && <div className="fixed inset-0" onClick={() => setIsOpen(false)}></div>}
      <div className="mb-2 flex items-center justify-start">
        <h3 className="text-sm font-medium text-gray-600">
          {months[currentMonth]} {currentYear}
        </h3>
        <Calendar1
          className="ml-2 h-4 w-4 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      <div
        ref={scrollRef}
        className="scrollbar-hidden mb-2 flex gap-2 overflow-x-auto"
        onScroll={handleScroll}
      >
        {allDays.map((date, idx) => {
          const isToday =
            date.date.getDate() === new Date().getDate() &&
            date.date.getMonth() === new Date().getMonth() &&
            date.date.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={idx}
              className="flex w-10 flex-shrink-0 flex-col items-center rounded-lg p-1"
            >
              <span
                className={`text-lg font-medium ${isToday ? "text-red-500" : "text-gray-900"}`}
              >
                {date.day}
              </span>
              <span
                className={`text-xs font-bold ${
                  isToday ? "text-red-500" : "text-gray-500"
                }`}
              >
                {date.weekday}
              </span>
            </div>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {isOpen && <FullCalendar key="calendar" />}
      </AnimatePresence>
    </div>
  );
};
