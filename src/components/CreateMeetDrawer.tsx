import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Drawer } from "vaul";
import { eventTypes } from "~/types/events";

interface CreateMeetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setType: (type: string) => void;
  type: string;
  subType: string;
  setSubType: (subType: string) => void;
}

export function CreateMeetDrawer({
  open,
  onOpenChange,
  setType,
  setSubType,
  type,
  subType,
}: CreateMeetDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle scroll behavior when drawer opens or type changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [open, type]);

  const handleEventTypeSelect = (eventType: string) => {
    console.log("Selected event type:", eventType);
  };

  const getSubType = (type: string) => {
    const underType = eventTypes.find((eventType) => eventType.name === type);
    return underType?.subtypes;
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white lg:h-[320px]">
          <div className="scrollbar-hidden overflow-y-auto p-4" ref={scrollRef}>
            <div className="fixed inset-x-0 top-0 z-10 mb-6 flex w-full items-center justify-between bg-white px-4 py-4">
              <button
                className="flex items-center justify-center"
                onClick={() => setType("")}
              >
                <ArrowLeft className="h-6 w-6 text-gray-900" />
              </button>
              <h2 className="flex-1 text-center text-base font-bold text-gray-900">
                Создание встречи
              </h2>
              <button
                className="flex items-center justify-center"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>

            {type ? (
              <div className="space-y-4 overflow-y-auto pt-12 pb-12">
                {getSubType(type)?.map((subType, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSubType(subType);
                      onOpenChange(false);
                    }}
                    className={`w-full rounded-2xl p-4 ${
                      eventTypes.find((e) => e.name === type)?.bgColor || "bg-gray-100"
                    } flex items-center justify-between transition-opacity hover:opacity-80`}
                  >
                    <span className="text-base font-medium text-nowrap text-gray-900">
                      {subType.length > 30 ? subType.slice(0, 30) + "..." : subType}
                    </span>
                    <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-gray-900" />
                  </button>
                ))}
                <button
                  className="absolute right-0 bottom-0 left-0 z-[100] mx-4 my-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50"
                  onClick={() => {
                    setSubType("");
                    onOpenChange(false);
                  }}
                >
                  Пропустить
                </button>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pt-12">
                {eventTypes.map((eventType, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleEventTypeSelect(eventType.name);
                      setType(eventType.name);
                      setSubType("");
                    }}
                    className={`w-full rounded-2xl p-4 ${eventType.bgColor} flex items-center justify-between transition-opacity hover:opacity-80`}
                  >
                    <div className="text-left">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-base">{eventType.emoji}</span>
                        <span className="text-base font-medium text-gray-900">
                          {eventType.name}
                        </span>
                      </div>
                      <p className="text-xs leading-tight text-gray-900">
                        {eventType.description}
                      </p>
                    </div>
                    <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-gray-900" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
