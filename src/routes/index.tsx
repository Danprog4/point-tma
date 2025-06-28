import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bell, ChevronDown, Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { CreateQuestDrawer } from "~/components/CreateQuestDrawer";
import { Logo } from "~/components/Icons/Logo";
import { useScroll } from "~/components/hooks/useScroll";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const isOnboarded = localStorage.getItem("isOnboarded");
    if (!isOnboarded || isOnboarded === "false") {
      throw redirect({
        to: "/onboarding",
      });
    }
  },
  component: Home,
});

function Home() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(trpc.main.getHello.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOnboarded, setIsOnboarded] = useLocalStorage("isOnboarded", false);

  useEffect(() => {
    if (!isOnboarded) {
      navigate({ to: "/onboarding" });
      return;
    }
  }, [isOnboarded, navigate]);

  if (!isOnboarded) {
    return null;
  }

  useScroll();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white pb-20">
      {/* Main Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Logo />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1">
          <div className="h-4 w-4 rounded-full bg-orange-400"></div>
          <span className="text-sm font-medium">0</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2">
            <Bell className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Secondary Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold text-gray-900">Афиша</h1>
        <div className="flex items-center gap-4">
          <button className="p-2">
            <Filter className="h-5 w-5 text-gray-700" />
          </button>
          <button className="p-2">
            <Search className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="w-full flex-1 overflow-x-hidden overflow-y-auto">
        {/* Filter Chips */}
        <div className="flex items-center gap-6 p-4 pb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
              <span className="text-sm font-medium">Алматы</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <div className="flex flex-nowrap gap-8 overflow-x-auto">
            {[
              { emoji: "🎞", name: "Кино" },
              { emoji: "🏛", name: "Театр" },
              { emoji: "🎄", name: "Новый год" },
              { emoji: "💃", name: "Конценты" },
              { emoji: "💞", name: "Клубы знакомств" },
              { emoji: "📈", name: "Конференции" },
            ].map((chip) => (
              <div
                key={chip.name}
                className="flex flex-row flex-nowrap items-center justify-center gap-1 rounded-full bg-white text-sm text-nowrap"
              >
                <div>{chip.emoji}</div>
                <div>{chip.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Event */}
        <div className="relative mb-2 w-full overflow-x-hidden">
          <div className="relative h-80 w-full overflow-hidden">
            <img
              src="/korol.png"
              alt="Панк-сказка «Король и Шут»"
              className="h-full w-full rounded-t-xl object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-medium text-black">
                Концерт
              </span>
            </div>
            <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h2 className="mb-2 text-xl font-bold text-white">
                Панк-сказка «Король и Шут»
              </h2>
              <div className="flex items-center gap-2 text-sm text-white">
                <span>15 января</span>
                <span>Халык Арена</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-6 w-full overflow-x-hidden px-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Июнь</h3>
          </div>
          <div className="mb-4 flex gap-2">
            {[
              { day: "5", weekday: "ВС", isWeekend: true },
              { day: "6", weekday: "ПН", isWeekend: false },
              { day: "7", weekday: "ВТ", isWeekend: false },
              { day: "8", weekday: "СР", isWeekend: false },
              { day: "9", weekday: "ЧТ", isWeekend: false },
              { day: "10", weekday: "ПТ", isWeekend: false },
              { day: "11", weekday: "СБ", isWeekend: true },
              { day: "12", weekday: "ВС", isWeekend: true },
              { day: "13", weekday: "ПН", isWeekend: false },
            ].map((date, idx) => (
              <div key={idx} className="flex w-12 flex-col items-center p-1">
                <span className="text-lg font-medium text-gray-900">{date.day}</span>
                <span
                  className={`text-xs font-bold ${date.isWeekend ? "text-red-500" : "text-gray-500"}`}
                >
                  {date.weekday}
                </span>
              </div>
            ))}
          </div>
          <div className="flex w-fit items-center gap-2 rounded-full border bg-white px-4 py-2 shadow-sm">
            <span className="text-sm font-medium">Все события</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mb-6 w-full overflow-x-hidden">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">По вашим рекомендациям</h2>
            <ArrowRight className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex gap-4 overflow-x-auto px-4">
            {[
              {
                title: "Пневмослон",
                subtitle: "17 января • По барабану",
                tag: "💃 Концерт",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-purple-400 to-pink-400",
              },
              {
                title: "Человек-паук",
                subtitle: "20 января • Сары-Арка",
                tag: "🎞 Кино",
                price: "2 500 ₸",
                bg: "bg-gradient-to-br from-blue-400 to-purple-400",
              },
              {
                title: "KazDrilling 2024",
                subtitle: "Renaissance Hotel",
                tag: "💃 Концерт",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-green-400 to-blue-400",
              },
            ].map((event, idx) => (
              <div
                key={idx}
                className="w-48 flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className={`h-32 ${event.bg} relative`}>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                      {event.tag}
                    </span>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                      {event.price}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quests Section */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">Квесты</h2>
            <ArrowRight className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex gap-4 overflow-x-auto px-4">
            {[
              {
                title: "Квест для дизайнеров",
                subtitle: "Получи любой курс за прохождение",
                tag: "🕹 Квест",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-orange-400 to-red-400",
              },
              {
                title: "Квест на поиск для развития коммуникационных навыков",
                subtitle: "Приз 1 ton",
                tag: "🕹 Квест",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-teal-400 to-blue-400",
              },
              {
                title: "KazDrilling 2024",
                subtitle: "Renaissance Hotel",
                tag: "💃 Концерт",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-green-400 to-blue-400",
              },
            ].map((event, idx) => (
              <div
                key={idx}
                className="w-48 flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className={`h-32 ${event.bg} relative`}>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                      {event.tag}
                    </span>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                      {event.price}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner */}
        <div className="mb-6 px-4">
          <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Квесты для компании</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                <Plus className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Conferences */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">ТОП Конференций</h2>
            <ArrowRight className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex w-full gap-4 overflow-x-auto px-4">
            {[
              {
                title: "Для костюмеров",
                bg: "bg-gradient-to-br from-yellow-400 to-orange-400",
              },
              {
                title: "Для DevOps",
                bg: "bg-gradient-to-br from-blue-400 to-purple-400",
              },
              {
                title: "Для инженеров",
                bg: "bg-gradient-to-br from-green-400 to-teal-400",
              },
            ].map((conf, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-4 text-center text-sm text-nowrap"
              >
                <div className={`h-48 w-36 ${conf.bg} relative rounded-lg`}>
                  <div className="absolute bottom-2 left-2">
                    <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold">
                      🎉 Конференция
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{conf.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parties Section */}
        <div className="mb-20">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">Вечеринки</h2>
            <ArrowRight className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex gap-4 overflow-x-auto px-4">
            {[
              {
                title: "Пост- новогодний вечер",
                subtitle: "15 января • Мозайка",
                tag: "🎄 Новый год",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-red-400 to-pink-400",
              },
              {
                title: "Гангстеры и розы",
                subtitle: "21 января • Алькатрас",
                tag: "💞 Клубы знакомств",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-pink-400 to-purple-400",
              },
              {
                title: "KazDrilling 2024",
                subtitle: "Renaissance Hotel",
                tag: "💃 Концерт",
                price: "3 000 ₸",
                bg: "bg-gradient-to-br from-green-400 to-blue-400",
              },
            ].map((event, idx) => (
              <div
                key={idx}
                className="w-48 flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <div className={`h-32 ${event.bg} relative`}>
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                      {event.tag}
                    </span>
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                      {event.price}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="mb-1 font-medium text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-500">{event.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Meeting Button */}
      <div className="fixed right-4 bottom-20 left-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
        >
          Создать встречу
        </button>
      </div>

      {/* Bottom Navigation */}

      {/* Create Quest Drawer */}
      <CreateQuestDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  );
}
