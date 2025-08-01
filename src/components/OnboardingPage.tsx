import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AddPhoto } from "~/components/Icons/AddPhoto";
import { Selecter } from "~/components/Selecter";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { onboardingConfig } from "~/onboardingConfig";
import { useTRPC } from "~/trpc/init/react";

export const OnboardingPage = () => {
  const trpc = useTRPC();
  const [step, setStep] = useState(0);
  const queryClient = useQueryClient();
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onBoarding = useMutation(trpc.main.getOnBoarding.mutationOptions({}));

  const monthOptions = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  // Валидация даты
  const validateDate = (day: string, month: string, year: string) => {
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    // Проверяем год (от 1900 до текущего года)
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) return false;

    // Проверяем месяц
    const monthIndex = monthOptions.indexOf(month);
    if (monthIndex === -1 && month !== "") return false;

    // Проверяем день
    if (dayNum < 1 || dayNum > 31) return false;

    // Проверяем корректность даты для конкретного месяца
    if (monthIndex !== -1 && day && year) {
      const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
      if (dayNum > daysInMonth) return false;
    }

    return true;
  };

  const formatDay = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return "";
    if (num < 1) return "1";
    if (num > 31) return "31";
    return num.toString();
  };

  const formatYear = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return "";
    const currentYear = new Date().getFullYear();
    if (num < 1900) return "1900";
    if (num > currentYear) return currentYear.toString();
    return num.toString();
  };

  // Проверяем валидность текущей даты
  const [dayPart, monthPart, yearPart] = birthday.split(".");
  const isDateValid = validateDate(dayPart || "", monthPart || "", yearPart || "");

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
      isOnboarded: true,
    });

    queryClient.setQueryData(trpc.main.getUser.queryKey(), (oldData: any) =>
      oldData ? { ...oldData, isOnboarded: true } : oldData,
    );
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
  const [isOpenCalendar, setIsOpenCalendar] = useState(false);

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
      !selectedFile ||
      !isDateValid);

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

  // Handler to delete main photo without triggering input
  const handleDeletePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setBase64(null);
    setSelectedFile(null);

    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoAreaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleEditPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const monthValue = birthday.split(".")[1] || "";
  const filteredMonths =
    monthValue.length > 0
      ? monthOptions.filter((m) => m.toLowerCase().includes(monthValue.toLowerCase()))
      : [];

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
            className="absolute inset-0 z-20 flex w-screen items-start justify-center overflow-hidden px-4"
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
              className="scrollbar-hidden flex h-full w-full max-w-md flex-col items-center justify-start overflow-y-auto text-white"
            >
              <div className="flex w-full flex-col px-4 pt-8 pb-24">
                <div className="mb-6 flex w-full flex-col items-center gap-4">
                  <div
                    onClick={handlePhotoAreaClick}
                    className="flex w-full cursor-pointer flex-col items-center gap-2"
                  >
                    {base64 ? (
                      <div className="relative w-full">
                        <img
                          src={base64}
                          alt="Аватар"
                          className="mb-2 h-48 w-full rounded-2xl object-cover"
                        />
                        <div className="absolute right-0 bottom-2 flex w-full items-center justify-center gap-20 rounded-b-2xl bg-[#12121280] px-4 py-2 text-white">
                          <div
                            className="z-[10000] cursor-pointer"
                            onClick={handleDeletePhoto}
                          >
                            Удалить
                          </div>
                          <div className="cursor-pointer" onClick={handleEditPhoto}>
                            Изменить
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2 flex h-48 w-full items-center justify-center rounded-2xl bg-[#F0F0F0]">
                        <div className="flex flex-col items-center gap-2">
                          <AddPhoto />
                          <div className="text-sm text-[#9924FF]">
                            Загрузить фото профиля
                          </div>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <h2 className="mb-4 text-start text-xl font-bold text-white">
                  Расскажите коротко о себе
                </h2>

                <div className="mb-4 text-start text-sm font-bold text-white">Пол</div>
                <div className="mb-6 flex items-center justify-start gap-6">
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
                  className="mb-4 h-12 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-base text-black placeholder:text-black/50"
                />

                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Фамилия"
                  className="mb-4 h-12 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-base text-black placeholder:text-black/50"
                />

                <input
                  type="text"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="@логин"
                  className="mb-4 h-12 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-base text-black placeholder:text-black/50"
                />

                <div className="relative mb-4 w-full">
                  <Selecter
                    cities={["Москва", "Санкт-Петербург", "Новосибирск"]}
                    setValue={(value) => setCity(value)}
                  />
                </div>

                <div className="relative mb-4 flex w-full gap-2">
                  <div
                    className={`flex min-w-0 flex-1 items-center justify-between rounded-[14px] border ${!isDateValid && dayPart ? "border-red-400" : "border-[#DBDBDB]"} bg-white px-3 py-3`}
                  >
                    <div className="flex w-full flex-col items-start text-xs">
                      <div className="mb-1 text-[#ABABAB]">День</div>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={birthday ? birthday.split(".")[0] || "" : ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          const num = parseInt(value);

                          // Не позволяем вводить число больше 31
                          if (num > 31) return;

                          const parts = birthday ? birthday.split(".") : ["", "", ""];
                          setBirthday(`${value}.${parts[1] || ""}.${parts[2] || ""}`);
                        }}
                        onBlur={(e) => {
                          const day = formatDay(e.target.value);
                          const parts = birthday ? birthday.split(".") : ["", "", ""];
                          setBirthday(`${day}.${parts[1] || ""}.${parts[2] || ""}`);
                        }}
                        className="w-full border-none bg-transparent text-base text-black outline-none"
                        placeholder="01"
                      />
                    </div>
                  </div>
                  <div
                    className={`flex min-w-0 flex-1 items-center justify-between rounded-[14px] border ${!isDateValid && monthPart ? "border-red-400" : "border-[#DBDBDB]"} bg-white px-3 py-3`}
                  >
                    <div className="relative w-full">
                      <div className="mb-1 text-xs text-[#ABABAB]">Месяц</div>
                      <input
                        type="text"
                        value={monthValue}
                        onClick={() => {
                          if (monthValue) {
                            const [d, , y] = birthday.split(".");
                            setBirthday(`${d || ""}.${""}.${y || ""}`);
                          }
                        }}
                        onChange={(e) => {
                          const m = e.target.value;
                          const [d, , y] = birthday.split(".");
                          setBirthday(`${d || ""}.${m}.${y || ""}`);
                        }}
                        className="w-full border-none bg-transparent text-base text-black outline-none"
                        placeholder="Январь"
                      />
                      {filteredMonths.length > 0 &&
                        !monthOptions.includes(monthValue) && (
                          <ul className="absolute top-full right-0 z-10 mt-1 max-h-40 w-[100px] overflow-auto rounded-lg border bg-white text-black shadow-lg">
                            {filteredMonths.map((m) => (
                              <li
                                key={m}
                                onClick={() => {
                                  const [d, , y] = birthday.split(".");
                                  setBirthday(`${d || ""}.${m}.${y || ""}`);
                                }}
                                className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                              >
                                {m}
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  </div>
                  <div
                    className={`flex min-w-0 flex-1 items-center justify-between rounded-[14px] border ${!isDateValid && yearPart ? "border-red-400" : "border-[#DBDBDB]"} bg-white px-3 py-3`}
                  >
                    <div className="flex w-full flex-col items-start text-xs">
                      <div className="mb-1 text-[#ABABAB]">Год</div>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={birthday ? birthday.split(".")[2] || "" : ""}
                        onChange={(e) => {
                          const year = e.target.value;
                          const parts = birthday ? birthday.split(".") : ["", "", ""];
                          setBirthday(`${parts[0] || ""}.${parts[1] || ""}.${year}`);
                        }}
                        onBlur={(e) => {
                          const year = formatYear(e.target.value);
                          const parts = birthday ? birthday.split(".") : ["", "", ""];
                          setBirthday(`${parts[0] || ""}.${parts[1] || ""}.${year}`);
                        }}
                        className="w-full border-none bg-transparent text-base text-black outline-none"
                        placeholder="1990"
                      />
                    </div>
                  </div>
                </div>

                {!isDateValid && birthday && dayPart && monthPart && yearPart && (
                  <div className="mb-4 text-sm text-red-400">
                    Пожалуйста, введите корректную дату рождения
                  </div>
                )}

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе"
                  className="h-32 w-full resize-none rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-base text-black placeholder:text-black/50"
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
          className="absolute right-0 bottom-0 left-0 mx-4 my-4 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white"
        >
          Далее
        </button>
      ) : (
        <div className="absolute bottom-0 left-0 z-[100] flex w-full items-center justify-between bg-[#71339b] py-4">
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
};
