import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
import { Step4 } from "~/components/createMeet/Step4";
import { Step5 } from "~/components/createMeet/Step5";
import { eventTypes } from "~/types/events";
export const Route = createFileRoute("/createMeet/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Все");
  const navigate = useNavigate();
  const { name } = useParams({ from: "/createMeet/$name" });
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(0);
  const emoji = eventTypes.find((e) => e.name === name)?.emoji;
  const isBasic = name !== "Совместное посещение";
  const [type, setType] = useState("");
  const isDisabled = title === "" || description === "";

  const handleNext = () => {
    setStep(step + 1);
  };

  console.log(step);

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
        />
      )}
      {step === 2 && <Step3 name={name} isBasic={isBasic} />}
      {step === 3 && <Step4 name={name} isBasic={isBasic} item={selectedItem} />}

      {step === 4 && (
        <Step5 isLoading={isLoading} setIsLoading={setIsLoading} name={name} />
      )}

      {(step < 4 && isBasic) || (step > 0 && !isBasic && step !== 4) ? (
        <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
          <button
            disabled={isDisabled}
            onClick={handleNext}
            className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50"
          >
            {step === 3 ? "Создать свидание" : "Продолжить"}
          </button>
        </div>
      ) : (
        !isLoading && (
          <div className="absolute right-0 bottom-4 mx-auto flex w-full flex-col items-center justify-center gap-2 px-4">
            <button
              // onClick={handleNext}
              className="z-[100] mx-4 w-full flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white"
            >
              Пригласить знакомых
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="z-[100] mx-4 w-full flex-1 rounded-tl-lg rounded-br-lg bg-white px-4 py-3 text-center text-black"
            >
              Перейдите в афишу
            </button>
          </div>
        )
      )}
    </div>
  );
}
