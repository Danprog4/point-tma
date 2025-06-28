import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Close } from "~/components/Icons/Close";
import { Selecter } from "~/components/Selecter";

export const Route = createFileRoute("/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const [step, setStep] = useState(0);
  const [isOnboarded, setIsOnboarded] = useLocalStorage("isOnboarded", false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOnboarded) {
      navigate({ to: "/" });
    }
  }, [isOnboarded, navigate]);

  const TOTAL_CARDS = 5;
  const LAST_STEP = TOTAL_CARDS + 1;

  const handleNext = () =>
    setStep((prev) => {
      if (prev === LAST_STEP) {
        navigate({ to: "/" });
        setIsOnboarded(true);
      }
      return prev + 1;
    });

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));
  const handleClose = () => {
    navigate({ to: "/" });
    setIsOnboarded(true);
  };

  console.log(step);
  const Card = ({
    category,
    text,
    emoji,
    color,
    height,
    transform,
  }: {
    category: string;
    text: string;
    emoji: string;
    color: string;
    height: number;
    transform?: string;
  }) => (
    <div
      className="flex w-[328px] flex-col items-start justify-center gap-2 rounded-xl bg-white p-4"
      style={{ backgroundColor: color, height, transform }}
    >
      <div className="flex items-center gap-2">
        <span>{emoji}</span>
        <span>{category}</span>
      </div>
      <div className="text-xs">{text}</div>
    </div>
  );

  return (
    <div className="mx-auto flex h-screen w-screen flex-col items-end bg-[#71339b] p-4">
      <header className="z-[100] flex items-center justify-end">
        <button onClick={handleClose}>
          <Close />
        </button>
      </header>

      {step === 0 ? (
        <>
          <div className="absolute right-0 bottom-50 left-0 z-10 px-4 text-center text-xl font-bold text-white">
            Добро пожаловать в Point
          </div>
          <video
            src="/intro_app.mp4"
            className="pointer-events-none absolute inset-0 object-cover select-none"
            autoPlay
            muted
            loop
            playsInline
          />
        </>
      ) : step <= TOTAL_CARDS ? (
        <div className="absolute top-50 right-0 left-0 z-10 px-4 text-center text-xl font-bold text-white">
          Здесь вы можете создавать
        </div>
      ) : null}

      {step > 0 && step <= TOTAL_CARDS && (
        <AnimatePresence>
          {step > 0 && (
            <motion.div
              key="card1"
              className="absolute"
              style={{ height: 92, top: "35%", left: "40%" }}
              initial={{ x: "100vw" }}
              animate={{ x: 0 }}
              exit={{ x: "100vw" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Card
                category="Квест"
                text="Оффлайн активность с выполнением заданий и вознаграждением"
                emoji="🦸"
                color="#F3E5FF"
                height={92}
                transform="rotate(-5.68deg)"
              />
            </motion.div>
          )}

          {step > 1 && (
            <motion.div
              key="card2"
              className="absolute"
              style={{ height: 92, top: "45%", left: "-6%" }}
              initial={{ x: "-100vw" }}
              animate={{ x: 0 }}
              exit={{ x: "-100vw" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              <Card
                category="Конференция"
                text="Вы хотите пригласить людей на серию лекций по определённой специфике."
                emoji="💁‍♂️"
                color="#D6E2FF"
                height={92}
                transform="rotate(8.15deg)"
              />
            </motion.div>
          )}

          {step > 2 && (
            <motion.div
              key="card3"
              className="absolute"
              style={{ height: 92, top: "51%", left: "34%" }}
              initial={{ x: "100vw" }}
              animate={{ x: 0 }}
              exit={{ x: "100vw" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            >
              <Card
                category="Нетворкинг"
                text="Это может обычная беседе в кафе или в другом общественном месте."
                emoji="💬"
                color="#EBFFF4"
                height={92}
                transform="rotate(-8.97deg)"
              />
            </motion.div>
          )}

          {step > 3 && (
            <motion.div
              key="card4"
              className="absolute"
              style={{ height: 86, top: "63%", left: "-3%" }}
              initial={{ x: "-100vw" }}
              animate={{ x: 0 }}
              exit={{ x: "-100vw" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
            >
              <Card
                category="Вечеринка"
                text="Совместный отдых и веселье"
                emoji="🎉"
                color="#FFE5E5"
                height={86}
                transform="rotate(5.62deg)"
              />
            </motion.div>
          )}

          {step > 4 && (
            <motion.div
              key="card5"
              className="absolute"
              style={{ height: 86, top: "72%", left: "34%" }}
              initial={{ x: "100vw" }}
              animate={{ x: 0 }}
              exit={{ x: "100vw" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
            >
              <Card
                category="Кино"
                text="Совместный поход в кино"
                emoji="📽️"
                color="#FFFBEB"
                height={86}
                transform="rotate(-9.87deg)"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {step === LAST_STEP && (
          <motion.div
            key="final-block-wrapper"
            className="absolute inset-0 z-20 flex w-screen items-center justify-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              key="final-block"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center text-white"
            >
              <div className="flex w-screen flex-col px-8">
                <h2 className="mb-4 text-start text-xl font-bold text-white">
                  Расскажите коротко о себе
                </h2>

                <input
                  type="text"
                  placeholder="Как вас зовут?"
                  className="mb-4 h-11 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                <input
                  type="number"
                  placeholder="Сколько вам лет?"
                  className="mb-4 h-11 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                <div className="relative mb-4">
                  <Selecter />
                </div>

                <textarea
                  placeholder="Опишите ваши интересы"
                  className="h-28 rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-sm text-black placeholder:text-black/50"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопки навигации */}
      {step === 0 ? (
        <button
          onClick={handleNext}
          className="absolute right-0 bottom-4 left-0 mx-4 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white"
        >
          Далее
        </button>
      ) : (
        <div className="absolute right-0 bottom-4 left-0 flex w-full items-center justify-between">
          <button
            onClick={handleBack}
            className="z-[100] ml-4 bg-transparent px-4 text-white"
          >
            Назад
          </button>
          <button
            onClick={handleNext}
            className="z-[100] mx-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white"
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
}
