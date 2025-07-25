import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
import { Step4 } from "~/components/createMeet/Step4";
import { Step5 } from "~/components/createMeet/Step5";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/createMeet")({
  component: RouteComponent,
});

function RouteComponent() {
  const search = useSearch({ from: "/createMeet" }) as {
    step?: number;
    isExtra?: boolean;
    isBasic?: boolean;
    typeOfEvent?: string;
    item?: any;
    id?: string;
    name?: string;
  };
  console.log({ search }, "search");
  const [isInvite, setIsInvite] = useState(false);
  const [important, setImportant] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typeOfEvent, setTypeOfEvent] = useState("");
  const queryClient = useQueryClient();
  const [title2, setTitle2] = useState("");
  const [description2, setDescription2] = useState("");
  const trpc = useTRPC();
  const [friendName, setFriendName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isForAll, setIsForAll] = useState(false);
  const navigate = useNavigate();

  const [step, setStep] = useState((search as any).step || 0);
  const [isExtra, setIsExtra] = useState((search as any).isExtra || false);
  const [date, setDate] = useState<string>("");
  const [type, setType] = useState("");
  const isDisabled = !title && !description;
  const isDisabled2 = !title2 && !description2;
  const [base64, setBase64] = useState("");
  const [participants, setParticipants] = useState(0);
  const [location, setLocation] = useState("");
  const [reward, setReward] = useState(0);
  const isBasic = search.isBasic ?? false;
  const name = search.name ?? "";
  
  const isHeicFile = (file: File): boolean => {
    const ext = file.name.toLowerCase();
    const mime = file.type.toLowerCase();
    return (
      ext.endsWith(".heic") ||
      ext.endsWith(".heif") ||
      mime === "image/heic" ||
      mime === "image/heif"
    );
  };

  const handleNext = () => {
    setStep(step + 1);

    if (step === 2 && !isBasic) {
      setIsForAll(true);
    }

    if (step === 3) {
      console.log("step 3");
      handleCreateMeeting();
    }
  };

  console.log(search.id, "search.id");

  const createMeeting = useMutation(trpc.meetings.createMeeting.mutationOptions());
  const inviteUsers = useMutation(trpc.meetings.inviteUsers.mutationOptions());
  const handleInvite = (meetId: number) => {
    inviteUsers.mutate({
      meetId: Number(meetId),
      userIds: selectedIds,
    });
  };
  const handleCreateMeeting = async () => {
    // предотвращаем повторный вызов
    if (createMeeting.isPending || createMeeting.isSuccess) return;
    const idOfEvent = selectedItem?.id ?? (search.item as any)?.id;

    const finalTypeOfEvent = typeOfEvent || (search.typeOfEvent as string) || "";
    await createMeeting.mutateAsync(
      {
        name: title || title2,
        description: description || description2,
        type: type,
        idOfEvent,
        typeOfEvent: finalTypeOfEvent,

        participants: participants || 0,
        location,
        reward: reward || 0,
        image: base64,
        invitedId: search.id !== undefined ? String(search.id) : undefined,
      },
      {
        onSuccess: (data: any) => {
          if (search?.id) {
            inviteUsers.mutate({
              meetId: data.id,
              userIds: [Number(search.id)],
            });
          }

          handleInvite(data.id);

          queryClient.invalidateQueries({
            queryKey: trpc.meetings.getMeetings.queryKey(),
          });
        },
        onError: (error) => {
          console.error("Error creating meeting:", error);
        },
      },
    );
  };

  console.log(base64, "base64");
  console.log(createMeeting.data);

  console.log(step);

  console.log(isDisabled, isDisabled2);

  return (
    <div className="relative flex h-screen w-screen flex-col p-4">
      <header className="fixed top-4 right-4 left-4 z-[100] flex items-center">
        {isInvite ? (
          <div onClick={() => setIsInvite(false)} className="cursor-pointer">
            <X />
          </div>
        ) : (
          <button onClick={() => window.history.back()}>
            <ArrowLeft />
          </button>
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-nowrap">
          {isInvite ? "Приглашение" : "Создание встречи"}
        </div>
      </header>
      {step < 4 && (
        <div className="flex items-center justify-center gap-2 pt-12 pb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-[25%] ${index <= step ? "bg-[#9924FF]" : "bg-gray-200"}`}
            />
          ))}
        </div>
      )}

      {step === 0 && (
        <Step1
          name={name}
          isBasic={isBasic}
          date={date}
          setDate={setDate}
          type={type}
          setType={setType}
          setSelectedItem={setSelectedItem}
          selectedItem={selectedItem}
          setStep={setStep}
          setTypeOfEvent={setTypeOfEvent}
          title2={title2}
          setTitle2={setTitle2}
          description2={description2}
          description={description}
          setDescription2={setDescription2}
          setDescription={setDescription}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          base64={base64}
          setBase64={setBase64}
          isHeicFile={isHeicFile}
          isExtra={isExtra}
          setIsExtra={setIsExtra}
          typeOfEvent={search.typeOfEvent || ""}
          item={search.item}
        />
      )}
      {step === 1 && (
        <Step2
          name={name}
          isBasic={isBasic}
          setSelectedItem={setSelectedItem}
          important={important}
          setImportant={setImportant}
          item={selectedItem || search.item}
          title={title}
          description={description}
          setTitle={setTitle}
          setDescription={setDescription}
          isDisabled={isDisabled}
          location={location}
          setLocation={setLocation}
        />
      )}
      {step === 2 && (
        <Step3
          name={name}
          isBasic={isBasic}
          isInvite={isInvite}
          setIsInvite={setIsInvite}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          friendName={friendName}
          setFriendName={setFriendName}
          setParticipants={setParticipants}
          participants={participants}
        />
      )}
      {step === 3 && (
        <Step4
          name={name}
          isBasic={isBasic}
          item={selectedItem || search.item}
          reward={reward}
          setReward={setReward}
          isInvite={isInvite}
        />
      )}

      {step === 4 && (
        <Step5
          isLoading={createMeeting.isPending}
          name={name}
          item={selectedItem || search.item}
          type={type}
          eventType={search.typeOfEvent || ""}
          isBasic={isBasic}
          title2={title2}
          description2={description2}
          reward={reward}
          setReward={setReward}
          base64={base64 || search.item?.image || selectedItem?.image}
        />
      )}
      {!isInvite && step < 4 ? (
        <div className="fixed right-0 bottom-4 left-0 z-[100] flex w-full items-center justify-between px-4">
          <button
            disabled={!(isDisabled || isDisabled2)}
            onClick={handleNext}
            className="z-[100] mx-auto flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50"
          >
            Продолжить
          </button>
        </div>
      ) : (
        <div></div>
      )}
      {step === 4 && (
        <div className="flx-1 fixed right-0 bottom-4 left-0 z-[100] flex w-full flex-col items-center justify-between gap-2 px-4">
          <button className="z-[100] mx-auto w-full flex-1 rounded-tl-lg rounded-br-lg px-4 py-3 text-center text-black disabled:opacity-50">
            Вернуться в афишу
          </button>
          <button className="z-[100] mx-auto w-full flex-1 rounded-tl-lg rounded-br-lg px-4 py-3 text-center text-black disabled:opacity-50">
            Поделиться
          </button>
        </div>
      )}
    </div>
  );
}
