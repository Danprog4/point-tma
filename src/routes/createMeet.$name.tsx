import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
import { Step4 } from "~/components/createMeet/Step4";
import { Step5 } from "~/components/createMeet/Step5";
import { useTRPC } from "~/trpc/init/react";

import { eventTypes } from "~/types/events";

export const Route = createFileRoute("/createMeet/$name")({
  component: RouteComponent,
});

function RouteComponent() {
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
  const { name } = useParams({ from: "/createMeet/$name" });
  const [step, setStep] = useState(0);
  const emoji = eventTypes.find((e) => e.name === name)?.emoji;
  const isBasic = name !== "Совместное посещение";
  const [type, setType] = useState("");
  const isDisabled = !title && !description;
  const isDisabled2 = !title2 && !description2;
  const [base64, setBase64] = useState("");
  const [participants, setParticipants] = useState(0);
  const [location, setLocation] = useState("");
  const [reward, setReward] = useState(0);
  const isHeicFile = (file: File): boolean => {
    return file.name.toLowerCase().endsWith(".heic");
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

  const createMeeting = useMutation(trpc.meetings.createMeeting.mutationOptions());
  const handleCreateMeeting = () => {
    const idOfEvent = selectedItem?.id;

    createMeeting.mutate(
      {
        name: title || title2,
        description: description || description2,
        type: type || name,
        idOfEvent,
        typeOfEvent,
        isCustom: isBasic,
        participants: participants || 0,
        location,
        reward: reward || 0,
        image: base64,
      },
      {
        onSuccess: () => {
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
        <button onClick={() => window.history.back()}>
          <ArrowLeft />
        </button>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-nowrap">
          {emoji} {name}
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
        />
      )}
      {step === 1 && (
        <Step2
          name={name}
          isBasic={isBasic}
          item={selectedItem}
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
          item={selectedItem}
          reward={reward}
          setReward={setReward}
        />
      )}

      {step === 4 && (
        <Step5
          isLoading={createMeeting.isPending}
          name={name}
          type={type || name}
          item={selectedItem}
          eventType={name}
          isBasic={isBasic}
          title2={title2}
          description2={description2}
          reward={reward}
          setReward={setReward}
          base64={base64}
        />
      )}

      {step === 2 && !isBasic && (
        <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
          <button
            onClick={handleNext}
            className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg px-4 py-3 text-center text-black disabled:opacity-50"
          >
            Сделать открытым для всех
          </button>
        </div>
      )}

      {step === 3 && !isBasic && (
        <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
          <button
            onClick={handleNext}
            className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg px-4 py-3 text-center text-black disabled:opacity-50"
          >
            Пропустить и создать {type}
          </button>
        </div>
      )}

      {(step < 4 && isBasic) ||
      (step > 0 && !isBasic && step !== 4 && step !== 2 && step !== 3) ? (
        <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
          <button
            disabled={!(isDisabled || isDisabled2)}
            onClick={handleNext}
            className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50"
          >
            {step === 3 ? "Создать свидание" : "Продолжить"}
          </button>
        </div>
      ) : (
        !createMeeting.isPending &&
        (isBasic ? (
          <div className="absolute right-0 bottom-4 mx-auto flex w-full flex-col items-center justify-center gap-2 px-4">
            <button className="z-[100] mx-4 w-full flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white">
              Пригласить знакомых
            </button>
            <button
              onClick={() => navigate({ to: "/my-meetings" })}
              className="z-[100] mx-4 w-full flex-1 rounded-tl-lg rounded-br-lg bg-white px-4 py-3 text-center text-black"
            >
              Перейти в мои встречи
            </button>
          </div>
        ) : (
          <div className="absolute right-0 bottom-4 mx-auto flex w-full flex-col items-center justify-center gap-2 px-4">
            <button onClick={() => navigate({ to: "/meetings" })}>
              Вернуться во встречи
            </button>
          </div>
        ))
      )}
    </div>
  );
}
