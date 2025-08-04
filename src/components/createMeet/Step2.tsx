import React, { useEffect, useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { Drag } from "~/components/Icons/Drag";
import { EventsDrawer } from "~/EventsDrawer";
import { Clocks } from "../Icons/Clocks";
// Предустановленные тэги, которые будут предлагаться при вводе
const predefinedTags = ["Свидание", "Культурный вечер", "Театр", "Вслепую", "Ужин"];

export const Step2 = ({
  name,
  isBasic,
  item,
  title,
  description,
  setTitle,
  setLocation,
  setDescription,
  isDisabled,
  location,
  important,
  setImportant,
  setSelectedItem,
  setIsDisabled,
}: {
  name: string;
  isBasic: boolean;
  item: any;
  title: string;
  description: string;
  setTitle: (title: string) => void;
  setLocation: (location: string) => void;
  setDescription: (description: string) => void;
  isDisabled: boolean;
  location: string;
  important: string;
  setImportant: (important: string) => void;
  setSelectedItem: (item: any) => void;
  setIsDisabled: (isDisabled: boolean) => void;
}) => {
  const [type, setType] = useState<"one" | "multiple">("one");
  const [length, setLength] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const filteredSuggestions = predefinedTags.filter(
    (tag) => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag),
  );

  const addTag = (tag: string) => {
    if (!tag) return;
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  useEffect(() => {
    setIsDisabled(true);
  }, []);

  useEffect(() => {
    if (location) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [location]);
  return (
    <>
      <div className="scrollbar-hidden flex flex-col overflow-y-auto pb-20">
        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            {Array.from({ length: length }).map((_, index) => (
              <>
                <div className="text-xl font-bold">Локации</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Название"
                    className="h-11 flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xl font-bold">Адрес</div>
                  <div className="text-sm text-blue-500" onClick={() => setIsOpen(true)}>
                    Выбрать из афишы
                  </div>
                </div>
                <div
                  key={index}
                  className="items-between flex flex-col justify-between gap-2"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="shrink-0 text-2xl font-bold">{index + 1}</div>
                    <input
                      type="text"
                      value={location}
                      placeholder="Название"
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50 md:min-w-[300px]"
                    />
                    <div className="flex h-6 w-6 shrink-0 items-start">
                      <Drag />
                    </div>
                  </div>

                  <div className="flex w-[calc(100%-40px)] flex-nowrap items-center gap-2">
                    <div
                      className=""
                      onClick={() => setLength(length > 2 ? length - 1 : length)}
                    >
                      <Bin />
                    </div>
                    <div className="flex w-full flex-1 gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Начало"
                          className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:pl-2 placeholder:text-black/50"
                        />
                        <div className="absolute top-1/2 left-1 -translate-y-1/2">
                          <Clocks />
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Завершение"
                          className="h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:pl-2 placeholder:text-black/50"
                        />
                        <div className="absolute top-1/2 left-1 -translate-y-1/2">
                          <Clocks />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ))}
          </div>
          <div
            className="mt-2 text-center text-[#9924FF]"
            onClick={() => setLength(length + 1)}
          >
            Добавить место
          </div>
        </div>
      </div>
      <EventsDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        setSelectedItem={setSelectedItem}
      />
    </>
  );
};
