import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Star, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/trpc/init/react";

interface ReviewEventDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: number;
  name: string;
}

export function ReviewEventDrawer({
  open,
  onOpenChange,
  id,
  name,
}: ReviewEventDrawerProps) {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [step, setStep] = useState<number>(1);
  const [review, setReview] = useState<string>("");
  const endQuest = useMutation(trpc.event.endQuest.mutationOptions());

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit min-h-[40vh] flex-col rounded-t-[16px] bg-white">
          <div className="flex-1 rounded-t-[16px] bg-white p-4">
            <div className="mb-6 flex items-center justify-end">
              <button onClick={() => onOpenChange(false)} className="p-1">
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>
            {step === 1 && (
              <>
                <div className="flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold">Завершить мероприятие?</div>
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
                  <div> Оцените квест</div>
                  <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-6 w-6 text-gray-900" />
                    ))}
                  </div>

                  <div className="w-full">
                    <textarea
                      onChange={(e) => setReview(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-300 p-2 py-4"
                      placeholder="Оставьте свой отзыв"
                    />
                  </div>
                  {review.length > 0 ? (
                    <div className="absolute right-4 bottom-2 left-4 mx-auto mt-4 flex w-auto items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                      <div
                        onClick={() => {
                          setStep(3);
                          endQuest.mutate({
                            id: Number(id),
                            name,
                          });
                        }}
                        className="z-[1000] rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white"
                      >
                        Отправить
                      </div>
                      <div className="z-[1000] flex-1 px-4 py-4 text-black">
                        Пожаловаться
                      </div>
                    </div>
                  ) : (
                    <div className="absolute right-4 bottom-2 left-4 mx-auto mt-4 flex w-auto items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
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
                  <div>Спасибо за ваш отзыв!</div>
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
