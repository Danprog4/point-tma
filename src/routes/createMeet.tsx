import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
import { Step4 } from "~/components/createMeet/Step4";
import { Step5 } from "~/components/createMeet/Step5";
import { usePlatform } from "~/hooks/usePlatform";
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
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInvite, setIsInvite] = useState(false);
  const [important, setImportant] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typeOfEvent, setTypeOfEvent] = useState("");
  const queryClient = useQueryClient();
  const [title2, setTitle2] = useState("");
  const [description2, setDescription2] = useState("");
  const trpc = useTRPC();
  const [isDisabled, setIsDisabled] = useState(true);
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
  const [base64, setBase64] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [mainPhotoRaw, setMainPhotoRaw] = useState<string>("");
  const [participants, setParticipants] = useState(0);
  const [location, setLocation] = useState("");
  const [reward, setReward] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const isBasic = search.isBasic ?? false;
  const name = search.name ?? "";
  const [subType, setSubType] = useState("");
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
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
        name: title2,
        description: description2,
        type: type,
        idOfEvent,
        typeOfEvent: type,

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
  console.log(title2, "title2");
  console.log(createMeeting.data);

  console.log(step);

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="relative flex h-screen w-screen flex-col p-4 pb-20 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4 data-[mobile=true]:pt-28"
      >
        {isInvite ? (
          <button
            onClick={() => setIsInvite(false)}
            className="absolute left-4 flex h-6 w-6 items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
        ) : isInventoryOpen ? (
          <button
            onClick={() => setIsInventoryOpen(false)}
            className="absolute left-4 flex h-6 w-6 items-center justify-center"
          >
            <X className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : window.history.back())}
            className="absolute left-4 flex h-6 w-6 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
        )}
        <h1 className="text-base font-bold text-gray-800">
          {isInvite
            ? "Приглашение"
            : isInventoryOpen
              ? "Выберите награду"
              : "Создание встречи"}
        </h1>
      </div>
      {step < 4 && (
        <div className="flex items-center justify-center gap-2 pb-6">
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
          subType={subType}
          setSubType={setSubType}
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
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
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          base64={base64}
          setBase64={setBase64}
          gallery={gallery}
          setGallery={setGallery}
          mainPhotoRaw={mainPhotoRaw}
          setMainPhotoRaw={setMainPhotoRaw}
          isHeicFile={isHeicFile}
          isExtra={isExtra}
          setIsExtra={setIsExtra}
          typeOfEvent={search.typeOfEvent || ""}
          item={search.item}
        />
      )}
      {step === 1 && (
        <Step2
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
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
          location={location}
          setLocation={setLocation}
        />
      )}
      {step === 2 && (
        <Step3
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
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
          important={important}
          setImportant={setImportant}
          tags={tags}
          setTags={setTags}
        />
      )}
      {step === 3 && (
        <Step4
          isDisabled={isDisabled}
          setIsDisabled={setIsDisabled}
          name={name}
          isBasic={isBasic}
          item={selectedItem || search.item}
          reward={reward}
          setReward={setReward}
          isInvite={isInvite}
          isInventoryOpen={isInventoryOpen}
          setIsInventoryOpen={setIsInventoryOpen}
          setSelectedInventory={setSelectedInventory}
          selectedInventory={selectedInventory}
          user={user}
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
            onClick={handleNext}
            disabled={isDisabled}
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
          <button
            className="z-[100] mx-auto w-full flex-1 rounded-tl-lg rounded-br-lg px-4 py-3 text-center text-black disabled:opacity-50"
            onClick={() => navigate({ to: "/" })}
          >
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
