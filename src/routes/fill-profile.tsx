import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { PlusIcon } from "~/components/Icons/Plus";
import { SettingsIcon } from "~/components/Icons/Settings";
import { steps } from "~/config/steps";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/fill-profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const setInterestsMutation = useMutation(
    trpc.main.setInterests.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
      },
    }),
  );

  const navigate = useNavigate();
  const { isSettingsSearch } = useSearch({ from: "/fill-profile" }) as {
    isSettingsSearch: boolean;
  };
  const [step, setStep] = useState(0);
  const [isSettings, setIsSettings] = useState(isSettingsSearch || false);
  const [cameFromSettings, setCameFromSettings] = useState(false);
  const [isClicked, setIsClicked] = useState<number | null>(null);
  const [interests, setInterests] = useState<{
    pets?: string;
    alcohol?: string;
    smoking?: string;
    animals?: string;
    sports?: string;
    education?: string;
    smokingHabits?: string;
    children?: string;
    interests?: string;
    zodiacSign?: string;
    music?: string;
    movies?: string;
    religion?: string;
    relationshipGoal?: string;
    hobbies?: string;
    books?: string;
    personalityType?: string;
    diet?: string;
    politicalViews?: string;
    badHabits?: string;
  }>({});

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      setInterests(user.interests ?? {});
      const nextStep = steps.findIndex((s) => {
        const key = getAnswerKeyByStepId(s.id);
        return key && !user.interests?.[key];
      });
      setStep(nextStep >= 0 ? nextStep : steps.length - 1);
      setInitialized(true);
    }
  }, [user, initialized]);

  useEffect(() => {
    if (isClicked !== null) {
      // Сохраняем интересы после каждого ответа
      setInterestsMutation.mutate({ interests });

      if (cameFromSettings) {
        setIsSettings(true);
        setCameFromSettings(false);
        setIsClicked(null);
      } else {
        setStep((prevStep) => prevStep + 1);
        setIsClicked(null);
      }
    }
  }, [isClicked, cameFromSettings, interests, setInterestsMutation]);

  const getPercent = () => {
    const answeredCount = Object.values(interests).filter(Boolean).length;
    const totalQuestions = steps.filter((s) => s.options && s.options.length > 0).length;
    return ((answeredCount / totalQuestions) * 100).toFixed(0);
  };

  const getAnswerKeyByStepId = (
    id: number,
  ):
    | "pets"
    | "alcohol"
    | "smoking"
    | "animals"
    | "sports"
    | "education"
    | "smokingHabits"
    | "children"
    | "interests"
    | "zodiacSign"
    | "music"
    | "movies"
    | "religion"
    | "relationshipGoal"
    | "hobbies"
    | "books"
    | "personalityType"
    | "diet"
    | "politicalViews"
    | "badHabits"
    | undefined => {
    switch (id) {
      case 0:
        return "pets";
      case 1:
        return "alcohol";
      case 2:
        return "smoking";
      case 3:
        return "animals";
      case 4:
        return "sports";
      case 5:
        return "education";
      case 6:
        return "smokingHabits";
      case 7:
        return "children";
      case 8:
        return "interests";
      case 9:
        return "zodiacSign";
      case 10:
        return "music";
      case 11:
        return "movies";
      case 12:
        return "religion";
      case 13:
        return "relationshipGoal";
      case 14:
        return "hobbies";
      case 15:
        return "books";
      case 16:
        return "personalityType";
      case 17:
        return "diet";
      case 18:
        return "politicalViews";
      case 19:
        return "badHabits";
      default:
        return undefined;
    }
  };

  const handleSetInterests = () => {
    setInterestsMutation.mutate({ interests });
  };

  const handleback = () => {
    handleSetInterests();
    if (isSettings) {
      setIsSettings(false);
    } else {
      navigate({ to: "/profile" });
    }
  };

  useEffect(() => {
    if (step === steps.length - 1 && !isSettings) {
      setInterestsMutation.mutate({ interests });
      const timer = setTimeout(() => {
        navigate({ to: "/profile" });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, isSettings, interests, setInterestsMutation, navigate]);

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="flex flex-col px-4 pt-10 data-[mobile=true]:pt-32"
    >
      <header
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <div className="flex h-6 w-6 items-center justify-center">
          {!isSettings && !isSettingsSearch ? (
            <button onClick={() => setIsSettings(!isSettings)}>
              <SettingsIcon />
            </button>
          ) : isSettingsSearch ? (
            <button onClick={() => navigate({ to: "/profile" })}>
              <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleback}
              className="flex h-6 w-6 items-center justify-center"
            >
              <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
            </button>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-center text-base font-bold text-gray-800">
            {isSettings ? "Вопросы" : "Заполнение профиля"}
          </h1>
        </div>
        <div className="h-6 w-6"></div>
      </header>
      {isSettings ? (
        <div>
          {steps
            .filter((s) => s.id !== steps.length - 1)
            .map((s) => {
              const key = getAnswerKeyByStepId(s.id);
              const answered = key ? Boolean(interests[key]) : false;
              return (
                <div
                  key={s.id}
                  className="mt-8 flex w-full cursor-pointer items-center justify-between px-4"
                  onClick={() => {
                    setCameFromSettings(true);
                    setStep(s.id);
                    setIsSettings(false);
                  }}
                >
                  <div className="text-xl font-bold">{s.question}</div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]">
                    {answered ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <PlusIcon />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <>
          <div className="mt-4 flex-1 rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
            <div className="flex flex-col gap-2">
              <div>Заполненность профиля {getPercent()}%</div>
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
                  {s.options?.map((op, index) => {
                    const key = getAnswerKeyByStepId(s.id);
                    const isSelected = key && interests[key] === op;

                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setIsClicked(index);
                          if (key) {
                            setInterests((prev) => ({ ...prev, [key]: op }));
                          }
                        }}
                        className="flex cursor-pointer items-center justify-between px-4"
                      >
                        <div>{op}</div>
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#CDCDCD]">
                          {(isClicked === index || isSelected) && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
