import { AnimatePresence, motion } from "framer-motion";
import { Calendar1, ChevronDown } from "lucide-react";
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
      const dayWidth = 56; // Width + gap
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
        const dayWidth = 56;
        const scrollPosition =
          todayIndex * dayWidth - scrollRef.current.clientWidth / 2 + 28;
        scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
    }
  }, []);

  return (
    <div className="w-full overflow-x-hidden px-0">
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      <div className="mb-4 flex items-center justify-between px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-1.5 transition-colors active:scale-95"
        >
          <span className="text-base font-bold text-gray-900">
            {months[currentMonth]} {currentYear}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full p-2 hover:bg-gray-100"
        >
          <Calendar1 className="h-5 w-5 text-purple-600" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hidden mb-6 flex gap-3 overflow-x-auto px-4 pb-2"
        onScroll={handleScroll}
      >
        {allDays.map((date, idx) => {
          const isToday =
            date.date.getDate() === new Date().getDate() &&
            date.date.getMonth() === new Date().getMonth() &&
            date.date.getFullYear() === new Date().getFullYear();

          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                scale: isToday ? 1.05 : 1,
              }}
              className={`flex h-[70px] w-[48px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] border transition-colors ${
                isToday
                  ? "border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-200"
                  : "border-transparent bg-gray-50 text-gray-600"
              }`}
            >
              <span
                className={`text-[10px] font-medium uppercase ${
                  isToday ? "text-white/80" : "text-gray-400"
                }`}
              >
                {date.weekday}
              </span>
              <span
                className={`text-xl font-bold ${isToday ? "text-white" : "text-gray-900"}`}
              >
                {date.day}
              </span>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {isOpen && (
          <div className="relative z-50">
            <FullCalendar key="calendar" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
