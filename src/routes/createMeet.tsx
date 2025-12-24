import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
import { Step4 } from "~/components/createMeet/Step4";
import { Step5 } from "~/components/createMeet/Step5";
import { Event, User } from "~/db/schema";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils/cn";
import { useTRPC } from "~/trpc/init/react";
import { eventTypes } from "~/types/events";

export const Route = createFileRoute("/createMeet")({
  component: RouteComponent,
});

function RouteComponent() {
  const search = useSearch({ from: "/createMeet" }) as {
    step?: number;
    isExtra?: boolean;
    isBasic?: boolean;
    typeOfEvent?: string;
    idOfEvent?: string;
    userId?: string;
    calendarDate?: string;
    event?: Event;
    selectedIds?: number[];
  };

  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isInvite, setIsInvite] = useState(false);
  const [important, setImportant] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    {
      id: number;
      type: string;
      index: number;
    }[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typeOfEvent, setTypeOfEvent] = useState("");
  const queryClient = useQueryClient();

  const trpc = useTRPC();
  const [isDisabled, setIsDisabled] = useState(true);
  const [friendName, setFriendName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [isForAll, setIsForAll] = useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState((search as any).step || 0);
  const [isExtra, setIsExtra] = useState((search as any).isExtra || false);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [type, setType] = useState("");
  const [base64, setBase64] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [mainPhotoRaw, setMainPhotoRaw] = useState<string>("");
  const [participants, setParticipants] = useState(0);
  const [index, setIndex] = useState(0);
  const [locations, setLocations] = useState<
    {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      isCustom?: boolean;
    }[]
  >([{ location: "", address: "" }]);
  const [reward, setReward] = useState(0);
  const [length, setLength] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const isBasic = search.isBasic ?? false;

  const [subType, setSubType] = useState("");
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
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

  useEffect(() => {
    if (search.userId || search.selectedIds) {
      setSelectedIds(search.selectedIds || [Number(search.userId)]);
    }
  }, [search.userId, search.selectedIds]);

  // Валидация idOfEvent перед использованием
  const eventId = search.idOfEvent ? Number(search.idOfEvent) : 0;
  const isValidEventId = !isNaN(eventId) && eventId > 0;

  const { data: event } = useQuery(
    trpc.event.getEvent.queryOptions({
      id: eventId,
      category: search.typeOfEvent ?? "",
    }),
  );

  useEffect(() => {
    if (search.typeOfEvent && event && isValidEventId) {
      setSelectedItems([
        ...selectedItems,
        { id: event?.id || 0, type: event?.type || "", index: 0 },
      ]);
      setLocations([
        {
          location: event?.title || "",
          address: event?.location || "",
          starttime: "", // Don't set starttime from date field - user should set it manually
          endtime: "", // Don't set endtime - user should set it manually
          isCustom: false,
          index: 0,
        },
      ]);
      setIndex(0);
    }
  }, [search.idOfEvent, event, isValidEventId]);

  useEffect(() => {
    if (search.event) {
      setLocations([
        {
          location: search.event?.title || "",
          address: search.event?.location || "",
          starttime: "",
          endtime: "",
        },
      ]);
      setLength(1);
    }
  }, [search.event]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }

    if (step === 2 && !isBasic) {
      setIsForAll(true);
    }

    if (step === 3) {
      handleCreateMeeting();
    }
  };

  const createMeeting = useMutation(trpc.meetings.createMeeting.mutationOptions());
  const inviteUsers = useMutation(trpc.meetings.inviteUsers.mutationOptions());
  const handleInvite = (meetId: number) => {
    inviteUsers.mutate({
      meetId: Number(meetId),
      userIds: selectedIds,
    });
  };
  const handleCreateMeeting = async () => {
    // предотвращаем повторный вызов
    if (createMeeting.isPending || createMeeting.isSuccess) return;

    const isBig =
      eventTypes.find((event) => event.name === type)?.isBig ??
      eventTypes.find((event) => event.subtypes.includes(typeOfEvent))?.isBig ??
      false;

    // Валидируем обязательные поля перед отправкой
    if (!title.trim()) {
      console.error("Title is required");
      return;
    }

    if (!date || isNaN(date.getTime())) {
      console.error("Valid date is required");
      return;
    }

    // Валидируем locations
    const validatedLocations = locations.filter(
      (loc) => loc.location?.trim() && loc.address?.trim(),
    );

    await createMeeting.mutateAsync(
      {
        name: title,
        description: description,
        type: type,
        subType,
        isBig,
        participants: participants || 0,
        locations: validatedLocations,
        date: date.toLocaleDateString("ru-RU"), // Format as dd.mm.yyyy
        reward: reward || 0,
        inventory: selectedInventory,
        image: mainPhotoRaw,
        invitedIds: selectedIds,
        gallery: gallery,
        important: important,
        calendarDate: search.calendarDate,
        time: time && !isNaN(time.getTime()) ? time.toTimeString().split(" ")[0] : "",
      },
      {
        onSuccess: async (data: any) => {
          if (search?.userId) {
            inviteUsers.mutate({
              meetId: data.id,
              userIds: [Number(search.userId)],
            });
          }

          handleInvite(data.id);

          // Принудительно инвалидируем кэш и ждем обновления
          await queryClient.invalidateQueries({
            queryKey: trpc.meetings.getMeetings.queryKey(),
          });

          // Дополнительно инвалидируем связанные запросы
          await queryClient.invalidateQueries({
            queryKey: trpc.meetings.getParticipants.queryKey(),
          });

          // Инвалидируем все запросы, связанные с встречами
          await queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === "meetings" ||
              query.queryKey.includes("getMeetings") ||
              query.queryKey.includes("getParticipants"),
          });
        },
        onError: (error) => {
          console.error("Error creating meeting:", error);
        },
      },
    );
  };

  const isMobile = usePlatform();

  const getStepTitle = () => {
    if (isInvite) return "Приглашение";
    if (isInventoryOpen) return "Выберите награду";
    if (step === 0) return "Основная информация";
    if (step === 1) return "Место встречи";
    if (step === 2) return "Участники";
    if (step === 3) return "Вознаграждение";
    return "Создание встречи";
  };

  return (
    <div
      data-mobile={isMobile}
      className="relative flex min-h-screen w-screen flex-col bg-[#FAFAFA] pb-20 data-[mobile=true]:pt-18"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        {isInvite ? (
          <button
            onClick={() => setIsInvite(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-95"
          >
            <X className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </button>
        ) : isInventoryOpen ? (
          <button
            onClick={() => setIsInventoryOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-95"
          >
            <X className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </button>
        ) : step < 4 ? (
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : window.history.back())}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-95"
          >
            <ArrowLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900">
          {getStepTitle()}
        </h1>

        <div className="w-10" />
      </div>

      {/* Progress Bar */}
      {step < 4 && !isInvite && !isInventoryOpen && (
        <div className="fixed top-[112px] right-0 left-0 z-40 bg-white px-4 pt-2 pb-4 data-[mobile=true]:top-[104px]">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="absolute top-0 bottom-0 left-0 bg-violet-600"
              initial={{ width: "0%" }}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-medium text-gray-400">
            <span className={cn(step >= 0 && "text-violet-600")}>Инфо</span>
            <span className={cn(step >= 1 && "text-violet-600")}>Место</span>
            <span className={cn(step >= 2 && "text-violet-600")}>Участники</span>
            <span className={cn(step >= 3 && "text-violet-600")}>Награда</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "flex-1 px-0 pt-24 data-[mobile=true]:pt-49",
          step === 4 && "pt-0 data-[mobile=true]:pt-0",
        )}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step1
                name={title}
                subType={subType}
                setSubType={setSubType}
                isDisabled={isDisabled}
                setIsDisabled={setIsDisabled}
                isBasic={isBasic}
                date={date}
                setDate={setDate}
                type={type}
                setType={setType}
                setStep={setStep}
                setTypeOfEvent={setTypeOfEvent}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                base64={base64}
                setBase64={setBase64}
                gallery={gallery}
                setGallery={setGallery}
                mainPhotoRaw={mainPhotoRaw}
                setMainPhotoRaw={setMainPhotoRaw}
                isHeicFile={isHeicFile}
                isExtra={isExtra}
                setIsExtra={setIsExtra}
                typeOfEvent={search.typeOfEvent || ""}
                time={time}
                calendarDate={search.calendarDate || ""}
                setTime={setTime}
                city={city}
                setCity={setCity}
              />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step2
                index={index}
                setIndex={setIndex}
                isDisabled={isDisabled}
                setIsDisabled={setIsDisabled}
                locations={locations}
                setLocations={setLocations}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                length={length}
                setLength={setLength}
                city={city}
                setCity={setCity}
                user={user as User}
              />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step3
                important={important}
                setImportant={setImportant}
                isDisabled={isDisabled}
                setIsDisabled={setIsDisabled}
                isInvite={isInvite}
                setIsInvite={setIsInvite}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                friendName={friendName}
                setFriendName={setFriendName}
                setParticipants={setParticipants}
                participants={participants}
                tags={tags}
                setTags={setTags}
                category={type}
              />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Step4
                event={event as Event}
                isDisabled={isDisabled}
                reward={reward}
                setReward={setReward}
                isInventoryOpen={isInventoryOpen}
                setIsInventoryOpen={setIsInventoryOpen}
                setSelectedInventory={setSelectedInventory}
                selectedInventory={selectedInventory}
                user={user}
              />
            </motion.div>
          )}
          {step === 4 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Step5
                isLoading={createMeeting.isPending}
                title={title}
                type={type}
                eventType={search.typeOfEvent || ""}
                isBasic={isBasic}
                reward={reward}
                setReward={setReward}
                base64={base64}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Buttons */}
      {!isInvite && step < 4 && (
        <div className="fixed right-0 bottom-0 left-0 z-[100] border-t border-gray-100 bg-white/80 p-4 pb-8 backdrop-blur-xl">
          <button
            onClick={handleNext}
            disabled={isDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
          >
            {step === 3 ? "Создать встречу" : "Продолжить"}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="fixed right-0 bottom-0 left-0 z-[100] flex flex-col gap-3 border-t border-gray-100 bg-white/80 p-4 pb-8 backdrop-blur-xl">
          <button
            className="flex w-full items-center justify-center rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-violet-200 transition-transform active:scale-95"
            onClick={() => navigate({ to: "/meetings" })}
          >
            Вернуться ко встречам
          </button>
          <button
            className="flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-900 shadow-sm transition-transform active:scale-95"
            onClick={() => navigate({ to: "/my-meetings" })}
          >
            Мои встречи
          </button>
        </div>
      )}
    </div>
  );
}
