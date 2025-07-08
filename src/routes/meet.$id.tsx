import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Settings } from "lucide-react";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { fakeUsers } from "~/config/fakeUsers";
import { meetingsConfig } from "~/config/meetings";
import { getEventData } from "~/lib/utils/getEventData";
export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const meeting = meetingsConfig.find((m) => m.id === parseInt(id));

  const event = getEventData(meeting?.eventType!, meeting?.eventId!);

  const organizer = fakeUsers.find((u) => u.meetings.includes(meeting?.id!));

  const age = new Date().getFullYear() - new Date(organizer?.birthday!).getFullYear();

  console.log(event);
  return (
    <div className="flex h-full flex-col overflow-y-auto pt-14 pb-10">
      <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between bg-white p-4">
        <ArrowLeft
          className="absolute left-4 h-6 w-6"
          onClick={() => window.history.back()}
        />
        <div className="flex flex-1 justify-center text-xl font-bold">Встреча</div>
      </header>
      <div className="flex flex-col p-4">
        <QuestCard quest={event!} />
        {event?.description}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center justify-center rounded-full bg-[#DEB8FF] px-3 text-black">
            + Достижение
          </div>
          <div className="flex items-center gap-1">
            + {event?.reward} points <Coin />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-6 text-white">
          <div className="p-3 text-black">Отказать</div>
          <div
            onClick={() =>
              navigate({
                to: "/event/$name/$id",
                params: { name: event?.category!, id: event?.id!.toString()! },
              })
            }
            className="flex flex-1 items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#9924FF] px-3 py-3"
          >
            Присоединиться
          </div>
        </div>
      </div>
      <div className="mb-4 px-4 text-2xl font-bold">Организатор</div>
      <div className="relative">
        <div className="relative h-[30vh] rounded-t-2xl bg-gradient-to-br from-purple-400 to-pink-300">
          {/* Level Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                <span className="text-xl font-bold text-white">1</span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
                <div className="rounded bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                  Уровень
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-4 left-4 flex items-center justify-center gap-2 rounded-md bg-[#FFD943] px-2 py-1">
            <div className="font-medium text-black">Пройти верификацию</div>
            <ArrowRight className="h-4 w-4 text-black" />
          </div>

          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50">
              <Settings className="h-4 w-4 text-black" />
            </button>
          </div>
        </div>
      </div>
      <div
        className="mt-2 flex flex-col items-center justify-center"
        onClick={() =>
          navigate({
            to: "/user-profile/$id",
            params: { id: organizer?.id!.toString()! },
          })
        }
      >
        <div className="text-2xl font-bold">
          {organizer?.name} {organizer?.surname}
        </div>
        <div className="text-sm text-gray-500">
          {organizer?.city}, {age}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-white">
        <div className="rounded-2xl bg-[#2462FF] px-4 py-2">Подписаться</div>
        <div className="rounded-2xl bg-[#9924FF] px-4 py-2">Добавить в друзья</div>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4">
        <div className="text-2xl font-bold">Интересы</div>
        <div className="text-sm text-gray-500">{organizer?.bio}</div>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4">
        <div className="text-2xl font-bold">Достижения</div>
        <div className="text-sm text-gray-500">У этого пользователя нет достижений</div>
      </div>
      <div className="mt-4 flex flex-col gap-2 pl-4">
        <div className="text-2xl font-bold">Навыки</div>
        <div className="flex w-full gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-[20vh] w-[40vw] flex-shrink-0 rounded-2xl bg-[#A3FFCD]"
            ></div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 px-4">
        <div className="text-2xl font-bold">Инвентарь</div>
        <div className="text-sm text-gray-500">
          Инвентарь этого пользователя пока пуст
        </div>
      </div>
    </div>
  );
}
