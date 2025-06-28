import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
export const Route = createFileRoute("/createMeet/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { name } = useParams({ from: "/createMeet/$name" });
  const [step, setStep] = useState(0);

  const handleNext = () => {
    setStep(step + 1);
  };

  console.log(step);

  return (
    <div className="flex h-screen w-screen flex-col p-4">
      <header className="fixed top-4 right-4 left-4 flex items-center">
        <button onClick={() => navigate({ to: "/" })}>
          <ArrowLeft />
        </button>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold">
          {name}
        </div>
      </header>
      {step < 3 && (
        <div className="flex items-center justify-center gap-2 pt-12 pb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`h-1 w-[25%] ${index <= step ? "bg-[#9924FF]" : "bg-gray-200"}`}
            />
          ))}
        </div>
      )}

      {step === 0 && <Step1 />}
      {step === 1 && <Step2 />}
      {step === 2 && <Step3 />}
      <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
        <button
          onClick={handleNext}
          className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white"
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
