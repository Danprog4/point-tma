import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Step2 } from "~/components/createMeet/Step2";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { User } from "~/db/schema";
import { usePeopleData } from "~/hooks";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/create-fastMeet")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("create-fastMeet");
  const trpc = useTRPC();

  const [index, setIndex] = useState(0);
  const [locations, setLocations] = useState<
    {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      coordinates?: [number, number];
      isCustom?: boolean;
    }[]
  >([{ location: "", address: "", starttime: "", endtime: "" }]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    {
      id: number;
      type: string;
      index: number;
    }[]
  >([]);
  const [length, setLength] = useState(1);
  const [city, setCity] = useState("");
  const { user } = usePeopleData();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const createFastMeet = useMutation(
    trpc.meetings.createFastMeet.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getFastMeets.queryKey(),
        });
        navigate({ to: "/people" });
      },
    }),
  );

  useEffect(() => {
    // Validate title
    if (!title.trim()) {
      setIsDisabled(true);
      return;
    }

    // Validate description
    if (!description.trim()) {
      setIsDisabled(true);
      return;
    }

    // Validate city
    if (!city.trim()) {
      setIsDisabled(true);
      return;
    }

    // Validate locations
    if (locations.length === 0) {
      setIsDisabled(true);
      return;
    }

    // Validate each location
    const locationsValid = locations.every((location, index) => {
      // Must have location name
      if (!location.location?.trim()) {
        console.log(`❌ Location ${index}: missing name`);
        return false;
      }

      // Must have address
      if (!location.address?.trim()) {
        console.log(`❌ Location ${index}: missing address`);
        return false;
      }

      // Must have valid coordinates
      if (!location.coordinates) {
        console.log(`❌ Location ${index}: missing coordinates`);
        return false;
      }

      // Must have start time
      if (!location.starttime?.trim()) {
        console.log(`❌ Location ${index}: missing start time`);
        return false;
      }

      // Must have end time
      if (!location.endtime?.trim()) {
        console.log(`❌ Location ${index}: missing end time`);
        return false;
      }

      // Validate time format (HH:MM)
      const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(location.starttime)) {
        console.log(`❌ Location ${index}: invalid start time format`);
        return false;
      }

      if (!timeRegex.test(location.endtime)) {
        console.log(`❌ Location ${index}: invalid end time format`);
        return false;
      }

      // Validate that start time is before end time
      const [startHour, startMin] = location.starttime.split(":").map(Number);
      const [endHour, endMin] = location.endtime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        console.log(`❌ Location ${index}: start time must be before end time`);
        return false;
      }

      // Must be custom (selected from search)
      if (!location.isCustom) {
        console.log(`❌ Location ${index}: not custom (not selected from search)`);
        return false;
      }

      console.log(`✅ Location ${index}: valid`, location);
      return true;
    });

    console.log("🔍 Form validation:", {
      title: !!title.trim(),
      description: !!description.trim(),
      city: !!city.trim(),
      locationsValid,
      isDisabled: !locationsValid,
    });

    setIsDisabled(!locationsValid);
  }, [title, description, city, locations]);

  const handleCreateFastMeet = () => {
    createFastMeet.mutate({
      name: title,
      description,
      locations,
    });
  };
  return (
    <div className="px-4">
      <div className="flex items-center justify-center py-4">
        <button
          className="absolute top-4.5 left-4 flex items-center justify-center"
          onClick={() => navigate({ to: "/people" })}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="font-bold">Создать быструю встречу</div>
      </div>
      <div className="flex flex-col items-start gap-2 py-4 pb-4">
        <div className="text-xl font-bold">Название *</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          type="text"
          placeholder={`Введите название`}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <div className="flex flex-col items-start gap-2 pb-4">
        <div className="text-xl font-bold">Описание *</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Введите описание`}
          className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <Step2
        user={user as User}
        setLocations={setLocations}
        setIndex={setIndex}
        index={index}
        isDisabled={isDisabled}
        locations={locations}
        length={length}
        setLength={setLength}
        setSelectedItems={setSelectedItems}
        setIsDisabled={setIsDisabled}
        selectedItems={selectedItems}
        city={city}
        setCity={setCity}
        isFastMeet={true}
      />
      <div className="fixed right-0 bottom-4 left-0 z-[100] flex w-full items-center justify-between px-4">
        <button
          onClick={() => {
            handleCreateFastMeet();
          }}
          disabled={isDisabled}
          className={`z-[100] mx-auto flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50 ${
            isDisabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {createFastMeet.isPending ? "Создаем..." : "Создать встречу"}
        </button>
      </div>
    </div>
  );
}
