import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { PlusIcon } from "~/components/Icons/Plus";
import { SettingsIcon } from "~/components/Icons/Settings";
export const Route = createFileRoute("/fill-profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSettings, setIsSettings] = useState(false);
  const [isClicked, setIsClicked] = useState<number | null>(null);

  const steps = [
    {
      id: 0,
      question: "У вас есть домашнее животное?",
      options: ["Да", "Нет"],
    },
    {
      id: 1,
      question: "Отношение к алкоголю?",
      options: ["Не употребляю", "Умеренно", "Часто", "Высшее"],
    },
    {
      id: 2,
      question: "Отношение к курению?",
      options: ["Не курю", "Умеренно", "Часто", "Высшее"],
    },
    {
      id: 3,
      question: "Ура, тест пройден! ",
    },
  ];

  useEffect(() => {
    if (isClicked !== null) {
      setTimeout(() => {
        setStep(step + 1);
        setIsClicked(null);
      }, 1000);
    }
  }, [isClicked]);

  console.log(step);
  console.log(isClicked);

  const getPercent = () => {
    return ((step / (steps.length - 1)) * 100).toFixed(0);
  };

  const handleback = () => {
    if (isSettings) {
      setIsSettings(false);
    } else {
      navigate({ to: "/profile" });
    }
  };

  return (
    <div className="flex flex-col px-4">
      <header className="flex items-center justify-between pt-4 pb-2">
        <button onClick={handleback} className="flex h-6 w-6 items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-center text-base font-bold text-gray-800">
            {isSettings ? "Вопросы" : "Заполнение профиля"}
          </h1>
        </div>
        <div className="flex h-6 w-6 items-center justify-center">
          {!isSettings && (
            <button onClick={() => setIsSettings(!isSettings)}>
              <SettingsIcon />
            </button>
          )}
        </div>
      </header>
      {isSettings ? (
        <div>
          {steps
            .filter((s) => s.id !== steps.length - 1)
            .map((s) => {
              return (
                <div className="mt-8 flex flex-col items-start">
                  <div className="flex w-full items-center justify-between">
                    <div className="m-4 text-xl font-bold">{s.question}</div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]">
                      <PlusIcon />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <>
          <div className="mt-4 flex-1 rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
            <div className="flex flex-col gap-2">
              <div>Заполенность профиля {getPercent()}%</div>
              <div className="h-2 w-full rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-[#9924FF]"
                  style={{ width: `${getPercent()}%` }}
                ></div>
              </div>
            </div>
          </div>
          {steps
            .filter((s) => s.id === step)
            .map((s) => (
              <div className="flex flex-col items-center py-4">
                <div className="h-40 w-40 rounded-full bg-white"></div>
                <div className="max-w-[60vw] text-center text-2xl font-bold">
                  {s.question}
                </div>
                <div className="mt-4 flex w-full flex-col gap-8">
                  {s.options?.map((op, index) => (
                    <div
                      onClick={() => setIsClicked(index)}
                      className="flex cursor-pointer items-center justify-between px-4"
                    >
                      <div>{op}</div>
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#CDCDCD]">
                        {isClicked === index && (
                          <Check className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
