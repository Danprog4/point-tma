import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
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
    }[]
  >([{ location: "", address: "", starttime: "", endtime: "", coordinates: [0, 0] }]);
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

  const createFastMeet = useMutation(
    trpc.meetings.createFastMeet.mutationOptions({
      onSuccess: () => {
        navigate({ to: "/people" });
      },
    }),
  );

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
          className="z-[100] mx-auto flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50"
        >
          {createFastMeet.isPending ? "Создаем..." : "Создать встречу"}
        </button>
      </div>
    </div>
  );
}
