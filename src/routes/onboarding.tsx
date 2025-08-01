import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Selecter } from "~/components/Selecter";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { onboardingConfig } from "~/onboardingConfig";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const [step, setStep] = useState(0);
  const queryClient = useQueryClient();
  const [isOnboarded, setIsOnboarded] = useLocalStorage("isOnboarded", false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [login, setLogin] = useState("");
  const [sex, setSex] = useState<"male" | "female" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState<string>("");
  const [bio, setBio] = useState("");
  const navigate = useNavigate();
  const onBoarding = useMutation(
    trpc.main.getOnBoarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
      },
    }),
  );

  useEffect(() => {
    if (isOnboarded) {
      navigate({ to: "/" });
    }
  }, [isOnboarded, navigate]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const TOTAL_CARDS = 5;
  const LAST_STEP = TOTAL_CARDS + 1;

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedFile(file);

    let fileToProcess: File = file;

    // If file is HEIC, convert to PNG first
    if (isHeicFile(fileToProcess)) {
      fileToProcess = await convertHeicToPng(fileToProcess);
    }

    const base64 = await convertToBase64(fileToProcess);

    setBase64(base64);
  };

  const handleSubmit = () => {
    onBoarding.mutate({
      name,
      surname,
      login,
      birthday,
      city,
      bio,
      sex: sex || "",
      photo: base64 || "",
    });
  };

  const handleNext = () =>
    setStep((prev) => {
      setDirection("forward");
      // Сохраняем данные ТЕКУЩЕЙ карточки перед переходом
      if (prev > 0 && prev <= TOTAL_CARDS) {
        const currentIndex = prev - 1;
        setPrevCardData(onboardingConfig[currentIndex]);
        const currentColor =
          currentIndex === 0
            ? "#F3E5FF"
            : currentIndex === 1
              ? "#D6E2FF"
              : currentIndex === 2
                ? "#EBFFF4"
                : currentIndex === 3
                  ? "#FFE5E5"
                  : "#FFFBEB";
        setPrevCardColor(currentColor);
      }
      setShowPrevCard(false);

      if (prev === LAST_STEP) {
        handleSubmit();
        navigate({ to: "/" });
        setIsOnboarded(true);
      }
      return prev + 1;
    });

  const handleBack = () =>
    setStep((prev) => {
      setDirection("backward");
      // При переходе назад сохраняем данные текущей карточки
      if (prev > 1 && prev <= TOTAL_CARDS) {
        const currentIndex = prev - 1;
        setPrevCardData(onboardingConfig[currentIndex]);
        const currentColor =
          currentIndex === 0
            ? "#F3E5FF"
            : currentIndex === 1
              ? "#D6E2FF"
              : currentIndex === 2
                ? "#EBFFF4"
                : currentIndex === 3
                  ? "#FFE5E5"
                  : "#FFFBEB";
        setPrevCardColor(currentColor);
      } else if (prev === 1) {
        // При переходе с первой карточки на стартовый экран
        // не сохраняем данные, карточка просто исчезает
        setPrevCardData(null);
      }
      setShowPrevCard(false);
      return Math.max(prev - 1, 0);
    });
  const handleClose = () => {
    navigate({ to: "/" });
    setIsOnboarded(true);
  };

  const isDisabled =
    step === LAST_STEP &&
    (!name ||
      !surname ||
      !login ||
      !birthday ||
      !city ||
      !bio ||
      !sex ||
      !base64 ||
      !selectedFile);

  console.log(base64);
  console.log(selectedFile);

  console.log(step);
  const Card = ({
    category,
    text,
    emoji,
    color,
    transform,
  }: {
    category: string;
    text: string;
    emoji: string;
    color: string;
    transform?: string;
  }) => (
    <div
      className="flex h-fit w-[360px] flex-col items-start justify-center gap-3 rounded-xl bg-white p-4"
      style={{ backgroundColor: color, transform }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-base font-semibold">{category}</span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-line">{text}</div>
    </div>
  );

  // Получаем активную карточку для показа в карусели
  const activeCardIndex = Math.max(0, step - 1);
  const activeCard = onboardingConfig[activeCardIndex];

  // Состояние, управляющее отображением статичной задней карточки
  const [showPrevCard, setShowPrevCard] = useState(false);
  const [prevCardData, setPrevCardData] = useState<(typeof onboardingConfig)[0] | null>(
    null,
  );
  const [prevCardColor, setPrevCardColor] = useState<string>("");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  return (
    <div className="flex h-screen w-screen flex-col items-center overflow-hidden bg-[#71339b] px-4">
      <header className="z-[100] flex items-center justify-end"></header>

      {step === 0 ? (
        <>
          <video
            src="/intro_app.mp4"
            className="pointer-events-none absolute inset-0 object-cover select-none"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            tabIndex={-1}
          />
          <div className="absolute right-0 bottom-30 left-0 z-[1000] px-4 text-center text-2xl font-bold text-white drop-shadow-lg">
            Добро пожаловать в Point
          </div>
        </>
      ) : step <= TOTAL_CARDS ? (
        <div className="absolute top-30 right-0 left-0 z-10 px-4 text-center text-xl font-bold text-white">
          Здесь вы можете найти!
        </div>
      ) : null}

      {/* Новая карусель с 3D эффектом */}
      {step > 0 && step <= TOTAL_CARDS && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1200px" }}
        >
          {/* Задняя заблюренная карточка (previous) появляется только после завершения exit */}
          {showPrevCard && prevCardData && (
            <div
              className="absolute"
              style={{
                transform: "translateZ(-250px) translateX(-120px) translateY(-80px)",
                filter: "blur(6px)",
                opacity: 0.25,
              }}
            >
              <Card
                category={prevCardData.name}
                text={prevCardData.description}
                emoji={prevCardData.emoji}
                color={prevCardColor}
              />
            </div>
          )}

          <AnimatePresence mode="popLayout" onExitComplete={() => setShowPrevCard(true)}>
            <motion.div
              key={`card-${activeCardIndex}`}
              initial={
                direction === "forward"
                  ? {
                      x: 200,
                      y: 150,
                      z: -200,
                      rotateY: 35,
                      rotateX: 15,
                      scale: 0.5,
                      opacity: 0,
                      filter: "blur(10px)",
                    }
                  : {
                      // При движении назад карточка появляется быстро и незаметно
                      x: 0,
                      y: 0,
                      z: 0,
                      rotateY: 0,
                      rotateX: 0,
                      scale: 0.8,
                      opacity: 0.3,
                      filter: "blur(3px)",
                    }
              }
              animate={{
                x: 0,
                y: 0,
                z: 0,
                rotateY: 0,
                rotateX: 0,
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
              }}
              exit={
                direction === "forward"
                  ? {
                      x: -120,
                      y: -80,
                      z: -250,
                      opacity: 0.25,
                      filter: "blur(6px)",
                    }
                  : step === 0
                    ? {
                        x: 300,
                        y: 200,
                        z: -400,
                        scale: 0.3,
                        opacity: 0,
                        filter: "blur(15px)",
                      }
                    : {
                        // При движении назад карточка уходит в ту же сторону что и при forward
                        x: -120,
                        y: -80,
                        z: -250,
                        opacity: 0.25,
                        filter: "blur(6px)",
                      }
              }
              transition={
                direction === "forward"
                  ? {
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1],
                      filter: { duration: 0.6 },
                    }
                  : {
                      // При движении назад анимация такая же по скорости
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1],
                      filter: { duration: 0.6 },
                    }
              }
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <Card
                category={activeCard.name}
                text={activeCard.description}
                emoji={activeCard.emoji}
                color={
                  activeCardIndex === 0
                    ? "#F3E5FF"
                    : activeCardIndex === 1
                      ? "#D6E2FF"
                      : activeCardIndex === 2
                        ? "#EBFFF4"
                        : activeCardIndex === 3
                          ? "#FFE5E5"
                          : "#FFFBEB"
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {step === LAST_STEP && (
          <motion.div
            key="final-block-wrapper"
            className="absolute inset-0 z-20 flex w-screen items-center justify-center overflow-hidden px-8"
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
              className="flex h-full w-full flex-col items-center justify-start text-white"
            >
              <div className="flex h-full w-screen flex-col px-8 pb-20">
                <label htmlFor="photo-upload" className="block cursor-pointer">
                  <div className="mx-auto mt-4 mb-2 flex h-[144px] w-[144px] flex-col items-center justify-center overflow-hidden rounded-full bg-white">
                    <div className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-[#F3E5FF] pt-[10px]">
                      <svg
                        width="30"
                        height="35"
                        viewBox="0 0 30 35"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20.3134 21.9187C23.8472 20.0218 26.25 16.2915 26.25 12.0001C26.25 5.7869 21.2132 0.750053 15 0.750053C8.7869 0.750053 3.75005 5.7869 3.75005 12.0001C3.75005 16.2916 6.15305 20.0219 9.6869 21.9188C5.89824 23.2763 2.7812 26.0441 0.968262 29.5895C4.81565 32.6628 9.69343 34.5001 15.0003 34.5001C20.3071 34.5001 25.1849 32.6628 29.0322 29.5897C27.2193 26.0441 24.1021 23.2762 20.3134 21.9187Z"
                          fill="#721DBD"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-[#787878]">
                      {selectedFile
                        ? selectedFile.name.length > 14
                          ? selectedFile.name.substring(0, 14) + "..."
                          : selectedFile.name
                        : "Загрузить фото"}
                    </div>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <h2 className="mb-4 text-start text-xl font-bold text-white">
                  Расскажите коротко о себе
                </h2>
                <div className="mb-4 text-start text-sm font-bold text-white">Пол</div>
                <div className="mb-4 flex items-center justify-start gap-6">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full border-2 border-white ${
                        sex === "female" ? "bg-[#FFD943]" : "bg-white"
                      }`}
                      onClick={() => setSex("female")}
                    ></div>
                    <span className="text-white">Женский</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full border-2 border-white ${
                        sex === "male" ? "bg-[#FFD943]" : "bg-white"
                      }`}
                      onClick={() => setSex("male")}
                    ></div>
                    <span className="text-white">Мужской</span>
                  </div>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя"
                  className="mb-4 h-11 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Фамилия"
                  className="mb-4 h-11 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="@логин"
                  className="mb-4 h-11 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                <input
                  type="text"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="Дата рождения"
                  className="mb-4 h-11 rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                <div className="relative mb-4">
                  <Selecter
                    cities={["Москва", "Санкт-Петербург", "Новосибирск"]}
                    setValue={(value) => setCity(value)}
                  />
                </div>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
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
        <div className="absolute bottom-4 left-0 z-[100] flex w-full items-center justify-between bg-[#71339b] py-2">
          <button
            onClick={handleBack}
            className="z-[100] ml-4 bg-transparent px-4 text-white"
          >
            Назад
          </button>
          <button
            disabled={isDisabled}
            onClick={handleNext}
            className={`z-[100] mx-4 flex-1 ${isDisabled && "bg-gray-500"} rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white`}
          >
            Далее
          </button>
        </div>
      )}
    </div>
  );
}
