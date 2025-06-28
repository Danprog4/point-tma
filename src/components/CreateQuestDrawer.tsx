import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";
import { Drawer } from "vaul";
import { eventTypes } from "~/types/events";

interface CreateQuestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateQuestDrawer({ open, onOpenChange }: CreateQuestDrawerProps) {
  const navigate = useNavigate();

  const handleEventTypeSelect = (eventType: string) => {
    console.log("Selected event type:", eventType);
    // Here you would navigate to the specific quest creation form
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 mt-24 flex h-[576px] flex-col rounded-t-[16px] bg-white">
          <div className="flex-1 rounded-t-[16px] bg-white p-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <button onClick={() => onOpenChange(false)} className="p-1">
                <X className="h-6 w-6 text-gray-900" />
              </button>
              <h2 className="flex-1 text-center text-base font-bold text-gray-900">
                Создание встречи
              </h2>
              <div className="w-6" /> {/* Spacer for center alignment */}
            </div>

            {/* Event Type Selection */}
            <div className="min-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
              {eventTypes.map((eventType, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleEventTypeSelect(eventType.name);
                    navigate({
                      to: "/createMeet/$name",
                      params: { name: eventType.name },
                    });
                  }}
                  className={`w-full rounded-2xl p-4 ${eventType.bgColor} flex items-center justify-between transition-opacity hover:opacity-80`}
                >
                  <div className="flex-1 text-left">
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
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
