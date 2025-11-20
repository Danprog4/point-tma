import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { WheelPicker } from "~/components/ui/WheelPicker";
import { cn } from "~/lib/utils";

function TimePicker({
  value,
  setTime,
  placeholder = "Выберите время"
}: {
  value: Date | null;
  setTime: (time: Date) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultDate = new Date();
  defaultDate.setHours(12, 0, 0, 0);
  
  const dateToUse = value || defaultDate;

  const [hour, setHour] = useState(dateToUse.getHours());
  const [minute, setMinute] = useState(dateToUse.getMinutes());

  useEffect(() => {
    if (isOpen) {
        const d = value || defaultDate;
        setHour(d.getHours());
        setMinute(d.getMinutes());
    }
  }, [isOpen, value]);

  const hours = Array.from({ length: 24 }, (_, i) => ({
    label: i.toString().padStart(2, "0"),
    value: i,
  }));

  const minutes = Array.from({ length: 60 }, (_, i) => ({
    label: i.toString().padStart(2, "0"),
    value: i,
  }));

  const handleChange = (type: "hour" | "minute", val: number) => {
    let newHour = hour;
    let newMinute = minute;

    if (type === "hour") newHour = val;
    if (type === "minute") newMinute = val;

    setHour(newHour);
    setMinute(newMinute);

    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(newHour);
    newDate.setMinutes(newMinute);
    setTime(newDate);
  };

  const formattedTime = value
    ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : placeholder;

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button 
            className={cn(
                "w-full h-14 px-4 bg-white text-left flex items-center text-base outline-none border-b border-gray-200 last:border-none",
                !value && "text-black/40"
            )}
        >
          <span className="text-black">{formattedTime}</span>
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[100] mt-24 flex flex-col rounded-t-[16px] bg-white pb-safe outline-none">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="w-16"></div>
                <div className="font-semibold text-lg">Время</div>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="w-16 text-right text-violet-600 font-semibold text-base"
                >
                    Готово
                </button>
            </div>

            <div className="flex w-full items-center justify-center gap-2 py-8">
                <div className="w-1/3">
                    <WheelPicker
                    options={hours}
                    value={hour}
                    onChange={(v) => handleChange("hour", v as number)}
                    />
                </div>
                <div className="flex items-center justify-center text-2xl font-bold mb-2">:</div>
                <div className="w-1/3">
                    <WheelPicker
                    options={minutes}
                    value={minute}
                    onChange={(v) => handleChange("minute", v as number)}
                    />
                </div>
            </div>
            <div className="h-6 w-full" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default TimePicker;
