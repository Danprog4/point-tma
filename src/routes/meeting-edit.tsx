import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import imageCompression from "browser-image-compression";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Step1 } from "~/components/createMeet/Step1";
import { Step2 } from "~/components/createMeet/Step2";
import { Step3 } from "~/components/createMeet/Step3";
import { Step4 } from "~/components/createMeet/Step4";
import { convertHeicToPng } from "~/lib/utils/convertHeicToPng";
import { convertToBase64 } from "~/lib/utils/convertToBase64";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { isHeicFile } from "~/lib/utils/isHeicFile";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/meeting-edit")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    meetId: search.meetId as string,
  }),
});

function RouteComponent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const meetId = searchParams.meetId;

  const { data: meeting } = useQuery(
    trpc.meetings.getMeetingById.queryOptions({ id: Number(meetId) }),
  );

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  // Step 1 state
  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64, setBase64] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [mainPhotoRaw, setMainPhotoRaw] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [calendarDate, setCalendarDate] = useState("");
  const [city, setCity] = useState("");

  // Step 2 state
  const [locations, setLocations] = useState<
    {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      isCustom?: boolean;
    }[]
  >([]);
  const [selectedItems, setSelectedItems] = useState<
    { id: number; type: string; index: number }[]
  >([]);
  const [length, setLength] = useState(1);

  // Step 3 state
  const [friendName, setFriendName] = useState("");
  const [participants, setParticipants] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isInvite, setIsInvite] = useState(false);
  const [important, setImportant] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("");

  // Step 4 state
  const [reward, setReward] = useState(0);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);

  // Common state
  const [currentStep, setCurrentStep] = useState(1);
  const [isDisabled, setIsDisabled] = useState(true);
  const [isExtra, setIsExtra] = useState(false);
  const [typeOfEvent, setTypeOfEvent] = useState("");

  const updateMeeting = useMutation(
    trpc.meetings.updateMeeting.mutationOptions({
      onSuccess: () => {
        // Invalidate all meeting-related queries
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getMeetingById.queryKey({ id: Number(meetId) }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getMeetingsWithEvents.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getMeetings.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getInvites.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getRequests.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getParticipants.queryKey(),
        });

        // Invalidate user data to refresh balance and inventory
        queryClient.invalidateQueries({
          queryKey: trpc.main.getUser.queryKey(),
        });

        toast.success("✅ Встреча обновлена!");
        navigate({ to: `/meet/${meetId}` });
      },
      onError: (error) => {
        toast.error(`❌ Ошибка обновления: ${error.message}`);
      },
    }),
  );

  // Initialize form with meeting data
  useEffect(() => {
    if (meeting) {
      setType(meeting.type || "");
      setSubType(meeting.subType || "");
      setTitle(meeting.name || "");
      setDescription(meeting.description || "");
      setDate(meeting.date || "");
      setTime(meeting.time || "");
      setCity(meeting.city || "");
      setParticipants(meeting.maxParticipants || 0);
      setReward(meeting.reward || 0);
      setImportant(meeting.important || "");
      setTags([]);
      setCategory(meeting.type || "");
      setLocations(meeting.locations || []);
      setLength(meeting.locations?.length || 1);
      setSelectedInventory(meeting.items?.map((item) => item.id?.toString() || "") || []);

      if (meeting.image) {
        setBase64(getImageUrl(meeting.image));
        setMainPhotoRaw(meeting.image);
      }

      if (meeting.gallery) {
        setGallery(meeting.gallery);
      }

      if (meeting.participantsIds) {
        setSelectedIds(meeting.participantsIds.filter((id) => id !== user?.id));
      }
    }
  }, [meeting, user?.id]);

  const handleUpdateMeeting = async () => {
    try {
      const payload = {
        id: Number(meetId),
        date,
        name: title,
        description,
        type,
        subType,
        participants,
        locations,
        reward,
        image: mainPhotoRaw,
        invitedIds: selectedIds,
        gallery,
        inventory: selectedInventory,
        important,
        time,
        city,
      };

      await updateMeeting.mutateAsync(payload);

      queryClient.invalidateQueries({
        queryKey: trpc.meetings.getMeetingById.queryKey({ id: Number(meetId) }),
      });
    } catch (error: any) {
      toast.error(`❌ Ошибка обновления: ${error.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    let fileToProcess: File = file;
    if (isHeicFile(fileToProcess)) {
      try {
        fileToProcess = await convertHeicToPng(fileToProcess);
      } catch (error: any) {
        toast.error(`❌ Преобразование HEIC в PNG не удалось: ${error.message}`);
        return;
      }
    }
    // Compress image to 1MB max
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
    let base64str: string;
    try {
      base64str = await convertToBase64(fileToProcess);
    } catch (error: any) {
      toast.error(`❌ Преобразование в Base64 не удалось: ${error.message}`);
      return;
    }
    setBase64(base64str);
    setMainPhotoRaw(base64str);
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let fileToProcess = file;
    if (isHeicFile(fileToProcess)) {
      try {
        fileToProcess = await convertHeicToPng(fileToProcess);
      } catch (error: any) {
        toast.error(`❌ Преобразование HEIC в PNG не удалось: ${error.message}`);
        return;
      }
    }
    // Compress image to 1MB max
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
    let base64str: string;
    try {
      base64str = await convertToBase64(fileToProcess);
    } catch (error: any) {
      toast.error(`❌ Преобразование в Base64 не удалось: ${error.message}`);
      return;
    }
    setGallery((prev) => [...prev, base64str]);
  };

  const handleGalleryClick = (item: string) => {
    setGallery((prev) => {
      const newGallery = prev.filter((i) => i !== item);
      if (mainPhotoRaw) newGallery.push(mainPhotoRaw);
      return newGallery;
    });
    setMainPhotoRaw(item);
    setBase64(item.startsWith("data:image/") ? item : getImageUrl(item));
    setSelectedFile(null);
  };

  const handleDeletePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (gallery.length > 0) {
      const [first, ...rest] = gallery;
      setGallery(rest);
      setMainPhotoRaw(first);
      setBase64(first.startsWith("data:image/") ? first : getImageUrl(first));
      setSelectedFile(null);
    } else {
      setBase64("");
      setMainPhotoRaw("");
      setSelectedFile(null);
    }
  };

  if (!meeting) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 pt-28">
        <button
          disabled={updateMeeting.isPending}
          onClick={() => navigate({ to: `/meet/${meetId}` })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-center text-base font-bold text-gray-800">
            Редактировать встречу
          </h1>
        </div>
      </div>

      <div className="mt-8 flex gap-4 overflow-y-hidden px-4 pt-38 pb-4">
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            currentStep === 1 ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setCurrentStep(1)}
        >
          Основное
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            currentStep === 2 ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setCurrentStep(2)}
        >
          Места
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            currentStep === 3 ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setCurrentStep(3)}
        >
          Участники
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            currentStep === 4 ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setCurrentStep(4)}
        >
          Награды
        </button>
      </div>

      <div className="px-4 pb-20">
        {currentStep === 1 && (
          <Step1
            type={type}
            setType={setType}
            subType={subType}
            setSubType={setSubType}
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
            typeOfEvent={typeOfEvent}
            setTypeOfEvent={setTypeOfEvent}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            setIsDisabled={setIsDisabled}
            calendarDate={calendarDate}
            setStep={() => {}}
            name=""
            isBasic={false}
            isDisabled={isDisabled}
            city={city}
            setCity={setCity}
          />
        )}

        {currentStep === 2 && (
          <Step2
            setLocations={setLocations}
            setIndex={() => {}}
            index={0}
            isDisabled={false}
            locations={locations}
            length={length}
            setLength={setLength}
            setSelectedItems={setSelectedItems}
            setIsDisabled={setIsDisabled}
            selectedItems={selectedItems}
          />
        )}

        {currentStep === 3 && (
          <Step3
            friendName={friendName}
            setFriendName={setFriendName}
            setParticipants={setParticipants}
            participants={participants}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            isInvite={isInvite}
            setIsInvite={setIsInvite}
            isDisabled={false}
            setIsDisabled={setIsDisabled}
            important={important}
            setImportant={setImportant}
            tags={tags}
            setTags={setTags}
            category={category}
          />
        )}

        {currentStep === 4 && (
          <Step4
            reward={reward}
            setReward={setReward}
            isInventoryOpen={isInventoryOpen}
            setIsInventoryOpen={setIsInventoryOpen}
            setSelectedInventory={setSelectedInventory}
            selectedInventory={selectedInventory}
            user={user}
            isDisabled={false}
          />
        )}
      </div>

      <button
        disabled={isDisabled || updateMeeting.isPending}
        onClick={handleUpdateMeeting}
        className={`fixed right-0 bottom-4 left-0 mx-4 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white ${
          (isDisabled || updateMeeting.isPending) && "bg-gray-300"
        }`}
      >
        {updateMeeting.isPending ? "Обновляем..." : "Обновить встречу"}
      </button>
    </div>
  );
}
