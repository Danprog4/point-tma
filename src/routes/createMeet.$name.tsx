import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

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
      <div className="flex items-center justify-center gap-2 pt-12 pb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`h-1 w-[25%] ${index <= step ? "bg-[#9924FF]" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-[#F0F0F0]"></div>
        <div className="text-xl text-[#9924FF]">Загрузить фото/афишу для вечеринки</div>
      </div>
      <div className="flex flex-col items-start gap-2 py-4 pb-4">
        <div className="text-xl font-bold">Название</div>
        <input
          type="text"
          placeholder={`Введите название ${name}`}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <div className="flex flex-col items-start gap-2">
        <div className="text-xl font-bold">Описание</div>
        <textarea
          placeholder={`Введите описание ${name}`}
          className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
        />
      </div>
      <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
        <button
          onClick={handleNext}
          className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white"
        >
          Далее
        </button>
      </div>
    </div>
  );
}
