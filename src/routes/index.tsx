import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { Calendar } from "~/components/Calendar";
import { CreateQuestDrawer } from "~/components/CreateQuestDrawer";
import { Header } from "~/components/Header";
import { Filters } from "~/components/Icons/Filters";
import { Selecter } from "~/components/Selecter";
import { useScroll } from "~/components/hooks/useScroll";
import { useTRPC } from "~/trpc/init/react";

import { EventCard } from "~/components/EventCard";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";

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

  function ConferenceCard({ conf }: { conf: any }) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-sm text-nowrap">
        <div className={`h-48 w-36 ${conf.bg || ""} relative overflow-hidden rounded-lg`}>
          {conf.image && (
            <img
              src={conf.image}
              alt={conf.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute bottom-2 left-2 z-10">
            <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold">
              🎉 Конференция
            </span>
          </div>
          {conf.image && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{conf.title}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-12 pb-20">
      {/* Top Navigation */}
      <Header />

      {/* Page Title */}
      <div className="flex items-center justify-between px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Афиша</h1>
        <div className="flex items-center gap-4">
          <button className="">
            <Filters />
          </button>
          <button>
            <Search className="h-6 w-6 text-gray-900" />
          </button>
        </div>
      </div>

      <div className="w-full flex-1 overflow-x-hidden overflow-y-auto">
        {/* Filter Chips */}
        <div className="flex items-center gap-6 p-4 pb-6">
          <div className="flex items-center gap-2">
            <Selecter height="h-10" width="w-full" placeholder="Алматы" />
          </div>
          <div className="flex flex-nowrap gap-8 overflow-x-auto">
            {[
              { emoji: "🎞", name: "Кино" },
              { emoji: "🏛", name: "Театр" },
              { emoji: "🎄", name: "Новый год" },
              { emoji: "💃", name: "Концерты" },
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
        <Calendar />
        <div className="mx-auto mb-4 flex max-w-[145px] items-center justify-center">
          <Selecter
            height="h-8"
            width="w-full"
            placeholder="Все события"
            cities={[
              "Все события",
              "Кино",
              "Театр",
              "Концерты",
              "Конференции",
              "Вечеринки",
            ]}
          />
        </div>
        {/* Recommendations Section */}
        <div className="mb-6 w-full overflow-x-hidden">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">По вашим рекомендациям</h2>
            <ArrowRight
              className="h-5 w-5 cursor-pointer text-gray-500"
              onClick={() => navigate({ to: "/all/$name", params: { name: "Кино" } })}
            />
          </div>
          <div className="flex gap-4 overflow-x-auto px-4">
            {(kinoData?.slice?.(0, 3) || []).map((event: any, idx: number) => (
              <EventCard key={idx} event={event} />
            ))}
          </div>
        </div>

        {/* Quests Section */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">Квесты</h2>
            <ArrowRight
              className="h-5 w-5 cursor-pointer text-gray-500"
              onClick={() => navigate({ to: "/all/$name", params: { name: "Квесты" } })}
            />
          </div>
          <div className="flex gap-4 overflow-x-auto px-4">
            {(questsData?.slice?.(0, 3) || []).map((event: any, idx: number) => (
              <EventCard key={idx} event={event} />
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
            <ArrowRight
              className="h-5 w-5 cursor-pointer text-gray-500"
              onClick={() =>
                navigate({ to: "/all/$name", params: { name: "Конференции" } })
              }
            />
          </div>
          <div className="flex w-full gap-4 overflow-x-auto px-4">
            {(conferencesData?.slice?.(0, 3) || []).map((conf: any, idx: number) => (
              <ConferenceCard key={idx} conf={conf} />
            ))}
          </div>
        </div>

        {/* Parties Section */}
        <div className="mb-20">
          <div className="mb-4 flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-gray-900">Вечеринки</h2>
            <ArrowRight
              className="h-5 w-5 cursor-pointer text-gray-500"
              onClick={() =>
                navigate({ to: "/all/$name", params: { name: "Вечеринки" } })
              }
            />
          </div>
          <div className="flex gap-4 overflow-x-auto px-4">
            {(partiesData?.slice?.(0, 3) || []).map((event: any, idx: number) => (
              <EventCard key={idx} event={event} />
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
