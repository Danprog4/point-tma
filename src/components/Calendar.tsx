import { AnimatePresence, motion } from "framer-motion";
import { Calendar1, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import DatePicker from "./DatePicker2";
import { FullCalendar } from "./ui/calendar";

interface CalendarProps {
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
}

export const Calendar = ({ selectedDate, onDateSelect }: CalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalDate, setInternalDate] = useState(new Date());
  
  // Use selectedDate if provided, otherwise internal state
  const currentDate = selectedDate !== undefined ? selectedDate : internalDate;
  
  // Reference date for generating the calendar view (always starts around today/selected to ensure visibility)
  // We don't want this to change on every click to avoid re-rendering the list and scrolling
  const [referenceDate, setReferenceDate] = useState(currentDate || new Date());

  const [currentMonth, setCurrentMonth] = useState(referenceDate.getMonth());
  const [currentYear, setCurrentYear] = useState(referenceDate.getFullYear());
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);

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

    // Use referenceDate for generating the grid
    const baseDate = referenceDate;

    for (let monthOffset = 0; monthOffset <= 6; monthOffset++) {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth() + monthOffset;
      const targetDate = new Date(year, month, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, targetMonth, day);
        
        // Don't show past days if we're looking relative to today
        if (monthOffset === 0 && day < today.getDate() && targetMonth === today.getMonth() && targetYear === today.getFullYear()) {
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

  // Scroll to selected date only on mount or if explicitly requested (e.g. initial load)
  // We skip this effect if it's just a click selection to prevent "scrolling on click"
  useEffect(() => {
    if (!isMounted.current && scrollRef.current) {
      const targetDate = currentDate || new Date();
      const targetIndex = allDays.findIndex(
        (day) =>
          day.date.getDate() === targetDate.getDate() &&
          day.date.getMonth() === targetDate.getMonth() &&
          day.date.getFullYear() === targetDate.getFullYear(),
      );

      if (targetIndex !== -1) {
        const dayWidth = 56;
        const scrollPosition =
          targetIndex * dayWidth - scrollRef.current.clientWidth / 2 + 28;
        scrollRef.current.scrollLeft = Math.max(0, scrollPosition);
      }
      isMounted.current = true;
    }
  }, []); // Run once on mount

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    } else {
      setInternalDate(date);
    }
    // Update reference date only if we want to shift the view (optional)
    // For now, we keep the view stable as requested
  };

  const handleDateChange = (date: Date) => {
      if (onDateSelect) {
          onDateSelect(date);
      } else {
          setInternalDate(date);
      }
      setReferenceDate(date); // Update reference for date picker selection to jump to it
      
      // Also scroll to it
      if (scrollRef.current) {
         // Logic to scroll to the new reference date would go here or rely on re-render
         // Since we updated referenceDate, allDays will regenerate centered on it (mostly)
         // But we need to reset scroll
         setTimeout(() => {
             if (scrollRef.current) scrollRef.current.scrollLeft = 0;
         }, 0);
      }
  };

  return (
    <div className="w-full overflow-x-hidden px-0">
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Hidden DatePicker trigger that we can activate programmatically or wrap around the button */}
      <div className="hidden">
         <DatePicker 
            value={currentDate || new Date()} 
            setDate={handleDateChange} 
         />
      </div>

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

        <div className="relative">
            <DatePicker 
                value={currentDate || new Date()} 
                setDate={handleDateChange}
                trigger={
                    <button
                    className="rounded-full p-2 hover:bg-gray-100"
                    >
                    <Calendar1 className="h-5 w-5 text-purple-600" />
                    </button>
                }
            />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-hidden flex gap-3 overflow-x-auto px-4 pb-2"
        onScroll={handleScroll}
      >
        {allDays.map((date, idx) => {
          const isSelected =
            currentDate &&
            date.date.getDate() === currentDate.getDate() &&
            date.date.getMonth() === currentDate.getMonth() &&
            date.date.getFullYear() === currentDate.getFullYear();

          return (
            <motion.button
              key={idx}
              onClick={() => handleDateClick(date.date)}
              initial={false}
              animate={{
                scale: isSelected ? 1.05 : 1,
              }}
              className={`flex h-[70px] w-[48px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-[16px] border transition-colors ${
                isSelected
                  ? "border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-200"
                  : "border-transparent bg-gray-50 text-gray-600"
              }`}
            >
              <span
                className={`text-[10px] font-medium uppercase ${
                  isSelected ? "text-white/80" : "text-gray-400"
                }`}
              >
                {date.weekday}
              </span>
              <span
                className={`text-xl font-bold ${isSelected ? "text-white" : "text-gray-900"}`}
              >
                {date.day}
              </span>
            </motion.button>
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
