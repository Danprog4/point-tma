import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import { More } from "~/components/More";
import { BuyQuest } from "~/components/quest/BuyQuest";
import { questsData } from "./quests";
export const Route = createFileRoute("/quest/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { id } = Route.useParams();

  const navigate = useNavigate();

  const questData = questsData.find((quest) => quest.id === Number(id));

  if (!questData) {
    return <div>Квест не найден</div>;
  }

  console.log(questsData);

  console.log(Number(id));

  console.log(questData);

  return (
    <>
      {isOpen ? (
        <>
          <BuyQuest quest={questData} setIsOpen={setIsOpen} />
          <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
            <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
              <button
                onClick={() => navigate({ to: "/quests" })}
                className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
              >
                Купить за {questData?.price}
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="pt-14 pb-24">
          <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between bg-white p-4 pb-4">
            <ArrowLeft
              className="absolute left-4 h-6 w-6"
              onClick={() => window.history.back()}
            />
            <div className="flex flex-1 justify-center text-xl font-bold">Квест</div>
          </header>
          <div className="relative">
            <img
              src={questData?.image}
              alt={questData?.title}
              className="h-[30vh] w-full rounded-t-xl object-cover"
            />
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white">
              <div className="text-2xl font-bold">{questData?.title}</div>
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-center justify-center rounded-full bg-black/25 px-2">
                  {questData?.type}
                </div>
                <div className="flex items-center justify-center rounded-full bg-[#2462FF] px-2">
                  {questData?.category}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="text-2xl font-bold">Описание</div>
            <div className="">{questData?.description}</div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="text-2xl font-bold">Локация</div>
            <div className="">{questData?.location}</div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="text-2xl font-bold">Организатор</div>
            <div className="text-l font-bold">{questData?.organizer}</div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="text-2xl font-bold">Этапы квеста</div>
            {questData?.stages.map((stage) => (
              <div className="flex flex-col items-start justify-center gap-2">
                <div className="text-l font-bold">{stage.title}</div>
                <div className="">{stage.desc}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="text-2xl font-bold">Расписание</div>
            <div className="text-l font-bold">{questData?.date}</div>
          </div>
          <div className="flex flex-col justify-center gap-2 px-4 py-4">
            <div className="flex items-center justify-start text-2xl font-bold">
              <div className="text-2xl font-bold">Награда </div>
              <div className="text-l pl-2 font-bold">+ {questData?.reward}</div>
              <Coin />
            </div>
            <div className="">За успешное выполнение квеста</div>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4">
            <div className="text-2xl font-bold">Достижение</div>
            <div className="">+1 Активный участник</div>
          </div>
          <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
            <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
              <button
                onClick={() => setIsOpen(true)}
                className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
              >
                Купить за {questData?.price}
              </button>

              <div className="flex flex-col items-center">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                >
                  <WhitePlusIcon />
                </div>
                <span className="text-xs">Ещё</span>
              </div>
            </div>
          </div>
          {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} />}
        </div>
      )}
    </>
  );
}
