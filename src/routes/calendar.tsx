import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import { More } from "~/components/More";
import { usePlatform } from "~/hooks/usePlatform";
export const Route = createFileRoute("/calendar")({
  component: RouteComponent,
});

const MONTHS = [
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

const WEEKDAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

// Mock event data - dates that have events
const EVENTS: number[] = [];

function RouteComponent() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = currentDate.getDate();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get the day of week for first day (0 = Sunday, adjust to Monday = 0)
  const startDay = (firstDay.getDay() + 6) % 7;

  // Get previous month's last days
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };

  const renderCalendarDay = (
    day: number,
    type: "prev" | "current" | "next",
    isToday = false,
  ) => {
    const hasEvent = type === "current" && EVENTS.includes(day);
    const opacity = type === "current" ? "opacity-100" : "opacity-30";

    return (
      <div
        key={`${type}-${day}`}
        className={`relative flex h-22 items-center justify-center ${opacity}`}
      >
        <div className="relative flex h-full w-full items-center justify-center">
          <span className="z-10 text-base font-medium text-gray-800">{day}</span>
          {isToday && (
            <div className="absolute bottom-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 transform rounded-full bg-purple-600" />
          )}
          {hasEvent && (
            <div className="absolute top-0 right-2 h-3.5 w-3.5 rounded-full bg-green-400" />
          )}
        </div>
      </div>
    );
  };

  const renderCalendarGrid = () => {
    const days = [];

    // Previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(renderCalendarDay(prevMonthDays - i, "prev"));
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today;
      days.push(renderCalendarDay(day, "current", isToday));
    }

    // Next month's leading days to fill the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    const nextMonthDays = totalCells - days.length;
    for (let day = 1; day <= nextMonthDays; day++) {
      days.push(renderCalendarDay(day, "next"));
    }

    return days;
  };

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full bg-white data-[mobile=true]:pt-35"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-center text-base font-bold text-gray-800">Календарь</h1>

        <button className="flex h-6 w-6 items-center justify-center"></button>
      </div>
      {/* Month Navigation */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-white px-4 data-[mobile=true]:pt-22"
      >
        <button
          onClick={() => navigateMonth("prev")}
          className="flex items-center justify-center px-4"
        >
          <ChevronLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>

        <div className="flex flex-1 flex-col items-center">
          <span className="text-base font-medium text-gray-800">{MONTHS[month]}</span>
          <span className="text-xs font-medium text-gray-400">{year}</span>
        </div>

        <button
          onClick={() => navigateMonth("next")}
          className="flex items-center justify-center px-4"
        >
          <ChevronRight className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
      </div>

      {/* Calendar */}
      <div className="pb-4">
        {/* Weekday Headers */}
        <div className="mx-4 mb-0 grid grid-cols-7 border-b border-gray-300 opacity-70">
          {WEEKDAYS.map((day) => (
            <div key={day} className="flex items-center justify-center pt-10 pb-4">
              <span className="text-base font-medium text-gray-800">{day}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">{renderCalendarGrid()}</div>
      </div>

      {/* Add Event Button */}
      <div className="fixed right-4 bottom-4 left-4">
        <div className="flex items-center gap-4">
          <button
            className="flex-1 bg-purple-600 px-4 py-3 text-base font-medium text-white"
            style={{ borderRadius: "16px 4px 16px 4px" }}
            onClick={() => navigate({ to: "/" })}
          >
            Добавить событие
          </button>
          <div className="flex flex-col items-center">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
            >
              <WhitePlusIcon />
            </div>
            <span className="text-xs">Ещё</span>
          </div>
        </div>
      </div>
      <div className="z-10"> {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} />}</div>
    </div>
  );
}
