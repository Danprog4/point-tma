import React, { useEffect, useState } from "react";
import { Bin } from "~/components/Icons/Bin";
import { Drag } from "~/components/Icons/Drag";
import { EventsDrawer } from "~/EventsDrawer";
import { Clocks } from "../Icons/Clocks";
// Предустановленные тэги, которые будут предлагаться при вводе
const predefinedTags = ["Свидание", "Культурный вечер", "Театр", "Вслепую", "Ужин"];

export const Step2 = ({
  setLocations,

  isDisabled,
  locations,

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
  setLocations: (
    locations: {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
    }[],
  ) => void;
  setDescription: (description: string) => void;
  isDisabled: boolean;
  locations: {
    location: string;
    address: string;
    starttime?: string;
    endtime?: string;
  }[];
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
  // Helper functions for time validation
  const isValidTime = (time?: string): boolean => {
    if (!time) return false;
    const t = time.trim();
    return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(t);
  };

  const isStartBeforeEnd = (start?: string, end?: string): boolean => {
    if (!isValidTime(start) || !isValidTime(end)) return false;
    const [h1, m1] = start!.split(":").map(Number);
    const [h2, m2] = end!.split(":").map(Number);
    return h1 < h2 || (h1 === h2 && m1 < m2);
  };

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
    if (locations.length === 0) {
      setIsDisabled(true);
      return;
    }
    const valid = locations.every(
      (loc) =>
        loc.location &&
        loc.starttime &&
        loc.endtime &&
        isValidTime(loc.starttime) &&
        isValidTime(loc.endtime) &&
        isStartBeforeEnd(loc.starttime, loc.endtime),
    );
    setIsDisabled(!valid);
  }, [locations]);

  return (
    <>
      <div className="scrollbar-hidden flex flex-col overflow-y-auto pb-20">
        <div className="flex flex-col">
          <div className="flex flex-col gap-2">
            {Array.from({ length: length }).map((_, index) => (
              <>
                <div className="text-xl font-bold">Этапы вечеринки</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <input
                    value={locations[index]?.location || ""}
                    type="text"
                    placeholder="Название"
                    className="h-11 flex-1 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                    onChange={(e) => {
                      const newLocations = [...locations];
                      if (!newLocations[index]) {
                        newLocations[index] = { location: "", address: "" };
                      }
                      newLocations[index].location = e.target.value;
                      setLocations(newLocations);
                    }}
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
                      value={locations[index]?.address || ""}
                      placeholder="Адрес"
                      onChange={(e) => {
                        const newLocations = [...locations];
                        if (!newLocations[index]) {
                          newLocations[index] = { location: "", address: "" };
                        }
                        newLocations[index].address = e.target.value;
                        setLocations(newLocations);
                      }}
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
                          value={locations[index]?.starttime}
                          onChange={(e) => {
                            const newLocations = [...locations];
                            newLocations[index].starttime = e.target.value;
                            setLocations(newLocations);
                          }}
                          className="placeholder:pl- h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white pr-4 pl-10 text-sm text-black placeholder:text-black/50"
                        />
                        <div className="absolute top-1/2 left-3 -translate-y-1/2">
                          <Clocks />
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Завершение"
                          value={locations[index]?.endtime}
                          onChange={(e) => {
                            const newLocations = [...locations];
                            newLocations[index].endtime = e.target.value;
                            setLocations(newLocations);
                          }}
                          className="placeholder:pl- h-11 w-full flex-1 rounded-[14px] border border-[#DBDBDB] bg-white pr-4 pl-10 text-sm text-black placeholder:text-black/50"
                        />
                        <div className="absolute top-1/2 left-3 -translate-y-1/2">
                          <Clocks />
                        </div>
                      </div>
                    </div>
                  </div>
                  {locations[index]?.starttime &&
                    !isValidTime(locations[index].starttime) && (
                      <div className="mt-1 text-sm text-red-500">
                        Неверный формат времени начала (ЧЧ:ММ)
                      </div>
                    )}
                  {locations[index]?.endtime &&
                    !isValidTime(locations[index].endtime) && (
                      <div className="mt-1 text-sm text-red-500">
                        Неверный формат времени завершения (ЧЧ:ММ)
                      </div>
                    )}
                  {locations[index]?.starttime &&
                    locations[index]?.endtime &&
                    isValidTime(locations[index].starttime) &&
                    isValidTime(locations[index].endtime) &&
                    !isStartBeforeEnd(
                      locations[index].starttime,
                      locations[index].endtime,
                    ) && (
                      <div className="mt-1 text-sm text-red-500">
                        Время завершения должно быть позже начала
                      </div>
                    )}
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
