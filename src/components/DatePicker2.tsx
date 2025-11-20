import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { WheelPicker } from "~/components/ui/WheelPicker";
import { monthOptions } from "~/config/months";
import { cn } from "~/lib/utils";

function DatePicker2({
  value,
  setDate,
}: {
  value: Date | null;
  setDate: (date: Date) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Default to year 2000 if no date selected
  const defaultDate = new Date(2000, 0, 1);
  const dateToUse = value || defaultDate;

  const [day, setDay] = useState(dateToUse.getDate());
  const [month, setMonth] = useState(dateToUse.getMonth()); // 0-11
  const [year, setYear] = useState(dateToUse.getFullYear());

  // Sync state when drawer opens or value changes
  useEffect(() => {
    if (isOpen) {
      const d = value || defaultDate;
      setDay(d.getDate());
      setMonth(d.getMonth());
      setYear(d.getFullYear());
    }
  }, [isOpen, value]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate arrays
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    label: (i + 1).toString(),
    value: i + 1,
  }));

  const months = monthOptions.map((m, i) => ({
    label: m,
    value: i,
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: currentYear - i,
  }));

  const handleChange = (type: "day" | "month" | "year", val: number) => {
    let newDay = day;
    let newMonth = month;
    let newYear = year;

    if (type === "day") newDay = val;
    if (type === "month") newMonth = val;
    if (type === "year") newYear = val;

    // Validate day
    const maxDays = new Date(newYear, newMonth + 1, 0).getDate();
    if (newDay > maxDays) {
      newDay = maxDays;
    }

    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);

    const newDate = new Date(newYear, newMonth, newDay);
    setDate(newDate);
  };

  const formattedDate = value
    ? value.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Выберите дату";

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button
          className={cn(
            "flex h-14 w-full items-center bg-white px-4 text-left text-base outline-none",
            !value && "text-black/40",
          )}
        >
          <span className="text-black capitalize">{formattedDate}</span>
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="pb-safe fixed right-0 bottom-0 left-0 z-[100] mt-24 flex flex-col rounded-t-[16px] bg-white outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <div className="w-16"></div> {/* Spacer */}
            <div className="text-lg font-semibold">Дата рождения</div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-16 text-right text-base font-semibold text-violet-600"
            >
              Готово
            </button>
          </div>

          {/* Picker */}
          <div className="scrollbar-hidden flex w-full items-center justify-center gap-0 py-8">
            <div className="w-1/4">
              <WheelPicker
                options={days}
                value={day}
                onChange={(v) => handleChange("day", v as number)}
              />
            </div>
            <div className="w-2/4">
              <WheelPicker
                options={months}
                value={month}
                onChange={(v) => handleChange("month", v as number)}
              />
            </div>
            <div className="w-1/4">
              <WheelPicker
                options={years}
                value={year}
                onChange={(v) => handleChange("year", v as number)}
              />
            </div>
          </div>
          {/* Safe area spacer for bottom bar navigation if needed */}
          <div className="h-6 w-full" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default DatePicker2;
