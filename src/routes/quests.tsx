import { createFileRoute } from "@tanstack/react-router";
import { Bell, Clock, MapPin, Plus, Search } from "lucide-react";
import { Logo } from "~/components/Icons/Logo";

export const Route = createFileRoute("/quests")({
  component: RouteComponent,
});

// Mock data for quests
const questsData = [
  {
    id: 1,
    title: "Квест «Дизайнер»",
    description:
      "Квест направленный на повышение практических навыков и знаний среди дизайнеров интерфейсов",
    date: "19 декабря",
    location: "г.Караганда",
    type: "Глобальный",
    category: "Обучающий",
    reward: 200,
    hasAchievement: true,
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 2,
    title: 'Голливудский квест в горах: "Охота за Золотым Сердцем"',
    description:
      "Семья отправляется в горы на отдых, но их приключение принимает неожиданный поворот.",
    date: "20 декабря",
    location: "г.Караганда",
    type: "Глобальный",
    category: "Тематический",
    reward: 20000,
    hasAchievement: false,
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 3,
    title: "Чистый район",
    description:
      'Город погрузился в хаос мусора! Загадочные "Хранители Чистоты" отправляют команды добровольцев на миссию по спасению своего района. У вас есть всего несколько часов, чтобы очистить территорию, найти спрятанные артефакты чистоты и выполнить особые задания.',
    date: "20 декабря",
    location: "г.Караганда",
    type: "Ежедневный",
    category: "Хелп-квест",
    reward: 2500,
    hasAchievement: true,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=88&h=88&fit=crop&crop=center",
  },
  {
    id: 4,
    title: "Повышаем коммуникационные навыки",
    description:
      "Участникам предлагается помочь детскому приюту собрать подарки и провести мастер-классы для детей. Это социальный проект, который объединяет людей вокруг благотворительности.",
    date: "23 декабря",
    location: "г.Караганда",
    type: "Ежедневный",
    category: "Саморазвитие",
    reward: 15000,
    hasAchievement: false,
    image:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=88&h=88&fit=crop&crop=center",
  },
];

// Calendar dates data
const calendarDates = [
  { date: "19", day: "ВС", isWeekend: true },
  { date: "20", day: "ПН", isWeekend: false },
  { date: "21", day: "ВТ", isWeekend: false },
  { date: "22", day: "СР", isWeekend: false },
  { date: "23", day: "ЧТ", isWeekend: false },
  { date: "24", day: "ПТ", isWeekend: false },
  { date: "25", day: "СБ", isWeekend: true },
  { date: "12", day: "ВС", isWeekend: true },
  { date: "13", day: "ПН", isWeekend: false },
];

function getCategoryColor(category: string) {
  switch (category) {
    case "Обучающий":
      return "bg-blue-500";
    case "Тематический":
      return "bg-yellow-400";
    case "Хелп-квест":
      return "bg-red-300";
    case "Саморазвитие":
      return "bg-purple-300";
    default:
      return "bg-gray-400";
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "Глобальный":
      return "bg-black/25";
    case "Ежедневный":
      return "bg-black/10";
    default:
      return "bg-gray-400";
  }
}

function QuestCard({ quest }: { quest: (typeof questsData)[0] }) {
  return (
    <div className="mb-4 flex gap-4">
      <img
        src={quest.image}
        alt={quest.title}
        className="h-[88px] w-[88px] flex-shrink-0 rounded-lg object-cover"
      />
      <div className="flex-1 space-y-2">
        <h3 className="w-52 text-base leading-6 font-bold text-black">{quest.title}</h3>

        <div className="flex items-center gap-2">
          <span
            className={`${getTypeColor(quest.type)} rounded-full px-2.5 py-0.5 text-xs font-medium text-black`}
          >
            {quest.type}
          </span>
          <span
            className={`${getCategoryColor(quest.category)} rounded-full px-2.5 py-0.5 text-xs font-medium text-white`}
          >
            {quest.category}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300">
                <Clock className="h-2 w-2 text-white" />
              </div>
              <span className="text-xs text-black">{quest.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center">
                <MapPin className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-xs text-black">{quest.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <div className="min-h-screen overflow-y-auto bg-white">
      {/* Main Header with coin balance */}
      <header className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center">
          <Logo />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-gray-300 px-3 py-1">
          <div className="h-4 w-4 rounded-full bg-orange-400"></div>
          <span className="text-sm font-medium">0</span>
        </div>
        <div className="flex items-center">
          <button className="p-2">
            <Bell className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Page Title Header */}
      <div className="flex items-center justify-between px-4 pb-8">
        <h1 className="text-3xl font-bold text-black">Квесты</h1>
        <button className="p-2">
          <Search className="h-5 w-5 text-black" />
        </button>
      </div>

      {/* Segment Control */}
      <div className="flex gap-4 px-4 pb-4">
        <button className="flex-1 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white">
          Новые
        </button>
        <button className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black">
          Активные
        </button>
      </div>

      {/* Calendar Section */}
      <div className="px-4 pb-4">
        <h2 className="pb-2 text-xs font-normal text-black">Январь</h2>

        {/* Calendar dates */}
        <div className="flex justify-between pb-2">
          {calendarDates.map((dateItem, index) => (
            <div key={index} className="flex w-12 flex-col items-center py-0.5">
              <span
                className={`text-xl font-medium ${dateItem.isWeekend ? "text-black" : "text-black"}`}
              >
                {dateItem.date}
              </span>
              <span
                className={`text-xs font-bold ${dateItem.isWeekend ? "text-red-500" : "text-gray-400"}`}
              >
                {dateItem.day}
              </span>
            </div>
          ))}
        </div>

        {/* Filter buttons */}
        <div className="flex w-full gap-2">
          <button className="flex items-center gap-1 rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white shadow-lg">
            Фильтр
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button className="flex items-center gap-1 rounded-2xl bg-white px-9 py-2.5 text-sm font-medium text-black shadow-lg">
            Показать календарь
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Quest Lists by Date */}
      <div className="space-y-4">
        {/* 19 декабря */}
        <div>
          <h3 className="px-4 pb-2 text-xs font-normal text-black">19 декабря</h3>
          <div className="px-4">
            <QuestCard quest={questsData[0]} />
            <p className="mb-4 text-xs leading-4 text-black">
              {questsData[0].description}
            </p>
            <div className="mb-6 flex items-center justify-between">
              {questsData[0].hasAchievement && (
                <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                  + Достижение
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  + {questsData[0].reward.toLocaleString()}
                </span>
                <span className="text-base font-medium text-black">points</span>
                <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 20 декабря */}
        <div>
          <h3 className="px-4 pb-2 text-xs font-normal text-black">20 декабря</h3>
          <div className="space-y-6 px-4">
            {/* Quest 2 */}
            <div>
              <QuestCard quest={questsData[1]} />
              <p className="mb-4 text-xs leading-4 text-black">
                {questsData[1].description}
              </p>
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-black">
                    + {questsData[1].reward.toLocaleString()}
                  </span>
                  <span className="text-base font-medium text-black">points</span>
                  <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
                </div>
              </div>
            </div>

            {/* Quest 3 */}
            <div>
              <QuestCard quest={questsData[2]} />
              <p className="mb-4 text-xs leading-4 text-black">
                {questsData[2].description}
              </p>
              <div className="flex items-center justify-between">
                {questsData[2].hasAchievement && (
                  <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                    + Достижение
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-base font-medium text-black">
                    + {questsData[2].reward.toLocaleString()}
                  </span>
                  <span className="text-base font-medium text-black">points</span>
                  <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 23 декабря */}
        <div>
          <h3 className="px-4 pb-2 text-xs font-normal text-black">23 декабря</h3>
          <div className="px-4">
            <QuestCard quest={questsData[3]} />
            <p className="mb-4 text-xs leading-4 text-black">
              {questsData[3].description}
            </p>
            <div className="mb-6 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  + {questsData[3].reward.toLocaleString()}
                </span>
                <span className="text-base font-medium text-black">points</span>
                <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Quest Button */}
      <div className="fixed right-0 bottom-15 left-0 flex items-center gap-4 p-5">
        <button className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg">
          Создать квест
        </button>
        <div className="flex flex-col items-center">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
            <Plus className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-xs text-purple-600">Ещё</span>
        </div>
      </div>
    </div>
  );
}
