import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/trpc/init/react";
import { ReviewStar } from "./Icons/ReviewStar";
interface ReviewEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: number;
  name: string;
  meetId?: number;
}

export function ReviewEventDrawer({
  open,
  onOpenChange,
  id,
  name,
  meetId,
}: ReviewEventDrawerProps) {
  const trpc = useTRPC();
  const [isComplaint, setIsComplaint] = useState(false);
  const sendReview = useMutation(trpc.main.sendReview.mutationOptions());
  const [star, setStar] = useState<number>(0);
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [review, setReview] = useState<string>("");
  const [complaint, setComplaint] = useState<string>("");
  const endQuest = useMutation(trpc.event.endQuest.mutationOptions());
  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());
  const handleSendReview = () => {
    setStep(3);
    endQuest.mutate({
      id: Number(id),
      name,
    });

    sendReview.mutate({
      eventId: id,
      review,
      rating: star,
    });
  };

  const handleSendComplaint = () => {
    setStep(3);
    endQuest.mutate({
      id: Number(id),
      name,
    });

    sendComplaint.mutate({
      eventId: id,
      complaint,
      name,
      meetId: meetId ? Number(meetId) : undefined,
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit min-h-[50vh] flex-col rounded-t-[16px] bg-white">
          <div className="flex items-center justify-end">
            <button onClick={() => onOpenChange(false)} className="p-4">
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </div>
          {!isComplaint ? (
            <div className="flex-1 rounded-t-[16px] bg-white p-4">
              {step === 1 && (
                <>
                  <div className="flex flex-col items-center justify-center">
                    <div className="absolute inset-0 mb-4 flex items-center justify-center text-center text-2xl font-bold">
                      Завершить квест?
                    </div>
                  </div>
                  <div className="absolute right-4 bottom-4 left-4 mx-auto mt-4 flex w-auto items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                    <div
                      onClick={() => setStep(2)}
                      className="z-[1000] rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white"
                    >
                      Да, завершить
                    </div>
                    <div
                      onClick={() => onOpenChange(false)}
                      className="z-[1000] flex-1 px-4 py-4 text-black"
                    >
                      Отмена
                    </div>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="flex w-full flex-col items-center gap-4">
                    <div className="text-xl font-bold">Оцените квест</div>
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <ReviewStar
                          key={index}
                          onClick={() => setStar(index + 1)}
                          isActive={star >= index + 1}
                        />
                      ))}
                    </div>

                    <div className="w-full">
                      <textarea
                        onChange={(e) => setReview(e.target.value)}
                        className="w-full rounded-lg border-2 border-gray-300 p-2 pt-4 pb-10"
                        placeholder="Оставьте свой отзыв"
                      />
                    </div>
                    {review.length > 0 || star > 0 ? (
                      <div className="absolute right-4 bottom-2 left-4 mx-auto mt-4 flex w-auto items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                        <div
                          onClick={handleSendReview}
                          className="z-[1000] rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white"
                        >
                          Отправить
                        </div>
                        <div
                          className="z-[1000] flex-1 px-4 py-4 text-black"
                          onClick={() => setIsComplaint(true)}
                        >
                          Пожаловаться
                        </div>
                      </div>
                    ) : (
                      <div
                        className="absolute right-4 bottom-2 left-4 mx-auto mt-4 flex w-auto items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white"
                        onClick={() => setIsComplaint(true)}
                      >
                        <div className="z-[1000] flex-1 px-4 py-4 text-black">
                          Пожаловаться
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold">Спасибо за оценку!</div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {step === 3 ? (
                <>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold">Спасибо за оценку!</div>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 pt-10">
                  <div className="text-xl font-bold">Пожаловаться на ивент</div>
                  <div className="w-full">
                    <textarea
                      onChange={(e) => setComplaint(e.target.value)}
                      className="my-2 w-full rounded-lg border-2 border-gray-300 p-2 pt-4 pb-10"
                      placeholder="Оставьте свой отзыв"
                    />
                  </div>
                  <div className="absolute right-0 bottom-2 left-0 mx-auto mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                    <div
                      onClick={handleSendComplaint}
                      className="z-[1000] w-full rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white"
                    >
                      Отправить
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
