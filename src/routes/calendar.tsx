import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import CalendarDrawer from "~/components/CalendarDrawer";
import { User } from "~/db/schema";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

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

const EVENT_COLORS = [
  "bg-purple-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-red-600",
  "bg-yellow-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-orange-600",
  "bg-cyan-600",
];

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get today's date for comparison
  const actualToday = new Date();
  const todayDate = actualToday.getDate();
  const todayMonth = actualToday.getMonth();
  const todayYear = actualToday.getFullYear();

  const { data: calendarEvents } = useQuery(trpc.main.getCalendarEvents.queryOptions());

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get the day of week for first day (0 = Sunday, adjust to Monday = 0)
  const startDay = (firstDay.getDay() + 6) % 7;

  // Get previous month's last days
  const prevMonth = new Date(year, month, 0);
  const prevMonthDays = prevMonth.getDate();

  const getRandomColor = (day: number, month: number, year: number) => {
    // Use day, month, year as seed for consistent color per date
    const seed = day + month * 31 + year * 365;
    return EVENT_COLORS[seed % EVENT_COLORS.length];
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(month - 1);
    } else {
      newDate.setMonth(month + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: number, type: "prev" | "current" | "next") => {
    let clickedDate: Date;

    if (type === "prev") {
      clickedDate = new Date(year, month - 1, day);
    } else if (type === "next") {
      clickedDate = new Date(year, month + 1, day);
    } else {
      clickedDate = new Date(year, month, day);
    }

    // Find events for the clicked date
    const eventsOnDate =
      calendarEvents?.filter((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === clickedDate.getDate() &&
          eventDate.getMonth() === clickedDate.getMonth() &&
          eventDate.getFullYear() === clickedDate.getFullYear()
        );
      }) || [];

    setSelectedDate(clickedDate.toISOString());
    setSelectedDateEvents(eventsOnDate);
    setIsCalendarDrawerOpen(true);
  };

  const renderCalendarDay = (day: number, type: "prev" | "current" | "next") => {
    // Check if this day has events in the database
    const hasEvent =
      type === "current" &&
      calendarEvents?.some((event) => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === month &&
          eventDate.getFullYear() === year
        );
      });

    // Check if this is today
    const isToday =
      type === "current" &&
      day === todayDate &&
      month === todayMonth &&
      year === todayYear;

    const opacity = type === "current" ? "opacity-100" : "opacity-30";

    // Get the appropriate month and year for color calculation
    let colorMonth = month;
    let colorYear = year;
    if (type === "prev") {
      colorMonth = month - 1;
      if (colorMonth < 0) {
        colorMonth = 11;
        colorYear = year - 1;
      }
    } else if (type === "next") {
      colorMonth = month + 1;
      if (colorMonth > 11) {
        colorMonth = 0;
        colorYear = year + 1;
      }
    }

    const eventColor = hasEvent ? getRandomColor(day, colorMonth, colorYear) : "";

    return (
      <div
        key={`${type}-${day}`}
        className={`relative flex h-22 cursor-pointer items-center justify-center ${opacity}`}
        onClick={() => handleDateClick(day, type)}
      >
        <div
          className={`relative flex h-12 w-12 items-center justify-center ${hasEvent ? `rounded-lg ${eventColor} text-white` : "text-black"}`}
        >
          <span className="z-10 text-base font-medium">{day}</span>
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
      days.push(renderCalendarDay(day, "current"));
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
        className="z-10 flex items-center justify-between bg-white pt-8"
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

      <CalendarDrawer
        user={user as User}
        open={isCalendarDrawerOpen}
        onOpenChange={setIsCalendarDrawerOpen}
        date={selectedDate}
        events={selectedDateEvents}
      >
        <div />
      </CalendarDrawer>
    </div>
  );
}
