import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Camera, ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Selecter } from "~/components/Selecter";
import { cn } from "~/lib/utils";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { onboardingConfig } from "~/onboardingConfig";
import { useTRPC } from "~/trpc/init/react";
import DatePicker2 from "./DatePicker2";

export const OnboardingPage = () => {
  const trpc = useTRPC();
  const [step, setStep] = useState(0);
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [login, setLogin] = useState("");
  const [sex, setSex] = useState<"male" | "female" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [city, setCity] = useState<string>("");
  const [bio, setBio] = useState("");

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onBoarding = useMutation(
    trpc.main.getOnBoarding.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
        navigate({ to: "/" });
      },
      onError: () => {
        toast.error("Ошибка при онбординге");
      },
    }),
  );

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
    if (!file) return;

    setSelectedFile(file);
    let fileToProcess: File = file;

    if (isHeicFile(fileToProcess)) {
      fileToProcess = await convertHeicToPng(fileToProcess);
    }

    try {
      const compressedFile = await imageCompression(fileToProcess, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      fileToProcess = compressedFile;
    } catch (error: any) {
      toast.error(`❌ Сжатие изображения не удалось: ${error.message}`);
      return;
    }

    try {
      const base64str = await convertToBase64(fileToProcess);
      setBase64(base64str);
    } catch (error: any) {
      toast.error(`❌ Преобразование в Base64 не удалось: ${error.message}`);
    }
  };

  const handleSubmit = () => {
    onBoarding.mutate({
      name,
      surname,
      login,
      birthday: birthday ? birthday.toLocaleDateString("ru-RU") : "",
      city,
      bio,
      sex: sex || "",
      photo: base64 || "",
      isOnboarded: true,
    });
  };

  const handleNext = () => {
    setStep((prev) => {
      if (prev === LAST_STEP) {
        handleSubmit();
        return prev;
      }
      return prev + 1;
    });
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
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

  // Components

  const IntroStep = () => (
    <motion.div
      key="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 z-0"
    >
      <video
        src="/intro_app.mp4"
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        controls={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      <div className="absolute right-0 bottom-24 left-0 px-6 text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-4 text-4xl font-bold text-white drop-shadow-lg"
        >
          Добро пожаловать в Point
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-lg text-white/80"
        >
          Твой мир реального общения
        </motion.p>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleNext}
        className="absolute right-4 bottom-4 left-4 rounded-2xl bg-white py-4 font-bold text-black shadow-xl"
      >
        Начать
      </motion.button>
    </motion.div>
  );

  const InfoStep = ({ index }: { index: number }) => {
    const data = onboardingConfig[index];
    // Using a solid modern background color instead of config color
    const bgColors = [
      "bg-[#7C3AED]", // Violet
      "bg-[#C026D3]", // Fuchsia
      "bg-[#DB2777]", // Pink
      "bg-[#4F46E5]", // Indigo
      "bg-[#2563EB]", // Blue
    ];
    const currentColor = bgColors[index % bgColors.length];

    return (
      <motion.div
        key={`step-${index}`}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-50%", opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center p-6 text-center",
          currentColor,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />

        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8 text-8xl drop-shadow-2xl"
        >
          {data.emoji}
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="z-10 mb-2 text-3xl font-bold text-white"
        >
          {data.title}
        </motion.h2>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="z-10 mb-6 text-xl font-semibold text-white/90"
        >
          {data.name}
        </motion.h3>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="z-10 max-w-sm rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
        >
          <p className="text-sm leading-relaxed whitespace-pre-line text-white/90">
            {data.description}
          </p>
        </motion.div>
      </motion.div>
    );
  };

  const FormStep = () => (
    <motion.div
      key="form"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 flex flex-col overflow-hidden bg-neutral-950"
    >
      <div className="scrollbar-hide flex-1 overflow-y-auto px-4 py-8 pb-32">
        <h2 className="mb-8 text-center text-2xl font-bold text-white">
          Создание профиля
        </h2>

        {/* Photo Upload */}
        <div className="mb-8 flex justify-center">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-neutral-700 bg-neutral-900 transition-colors hover:border-violet-500"
          >
            {base64 ? (
              <img src={base64} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-neutral-500 transition-colors group-hover:text-violet-400">
                <Camera size={32} />
                <span className="mt-2 text-xs">Добавить фото</span>
              </div>
            )}

            {base64 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="text-white" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Sex Selection */}
        <div className="mb-6">
          <label className="mb-3 block px-1 text-sm font-medium text-white/70">Пол</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSex("male")}
              className={cn(
                "rounded-2xl border p-4 transition-all duration-200",
                sex === "male"
                  ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-900/50"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800",
              )}
            >
              Мужской
            </button>
            <button
              onClick={() => setSex("female")}
              className={cn(
                "rounded-2xl border p-4 transition-all duration-200",
                sex === "female"
                  ? "border-pink-500 bg-pink-600 text-white shadow-lg shadow-pink-900/50"
                  : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-neutral-800",
              )}
            >
              Женский
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="h-14 w-full rounded-2xl bg-white px-4 text-base text-black placeholder:text-black/40 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />

          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Фамилия"
            className="h-14 w-full rounded-2xl bg-white px-4 text-base text-black placeholder:text-black/40 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />

          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="@логин"
            className="h-14 w-full rounded-2xl bg-white px-4 text-base text-black placeholder:text-black/40 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />

          <div className="relative">
            <Selecter
              cities={["Москва", "Санкт-Петербург", "Новосибирск", "Алматы"]}
              setValue={setCity}
            />
          </div>

          <div className="overflow-hidden rounded-2xl bg-white">
            <DatePicker2 value={birthday} setDate={setBirthday} />
          </div>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Опишите ваши интересы"
            className="h-32 w-full resize-none rounded-2xl bg-white px-4 py-3 text-base text-black placeholder:text-black/40 focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-black font-sans">
      <AnimatePresence mode="wait">{step === 0 && IntroStep()}</AnimatePresence>

      <AnimatePresence mode="popLayout">
        {step > 0 && step <= TOTAL_CARDS && InfoStep({ index: step - 1 })}
        {step === LAST_STEP && FormStep()}
      </AnimatePresence>

      {/* Navigation Controls (Hidden on Step 0) */}
      {step > 0 && !onBoarding.isPending && (
        <div className="absolute right-0 bottom-0 left-0 z-50 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10">
          {/* Progress Indicators */}
          <div className="mb-6 flex justify-center gap-2">
            {Array.from({ length: LAST_STEP }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i + 1 === step ? "w-8 bg-white" : "w-2 bg-white/30",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20 active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleNext}
              disabled={isDisabled && step === LAST_STEP}
              className={cn(
                "flex h-14 flex-1 items-center justify-center rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95",
                step === LAST_STEP && isDisabled
                  ? "bg-neutral-800 text-neutral-500"
                  : "bg-white text-black shadow-white/20 hover:bg-neutral-200",
              )}
            >
              {step === LAST_STEP ? "Создать профиль" : "Далее"}
              {step !== LAST_STEP && <ArrowRight size={20} className="ml-2" />}
            </button>
          </div>
        </div>
      )}

      {onBoarding.isPending && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <span className="font-medium text-white">Создаем профиль...</span>
          </div>
        </div>
      )}
    </div>
  );
};
