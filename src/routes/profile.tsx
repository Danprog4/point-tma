import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Bell,
  Calendar,
  ChevronRight,
  Crown,
  Edit,
  History,
  Package,
  Settings,
  Star,
} from "lucide-react";
import { useScroll } from "~/components/hooks/useScroll";
import { Logo } from "~/components/Icons/Logo";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  useScroll();

  return (
    <div className="min-h-screen overflow-y-auto bg-white">
      {/* Top Navigation */}
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

      {/* Page Title */}
      <div className="px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Профиль</h1>
      </div>

      {/* Segment Control */}
      <div className="px-4 pt-1 pb-4">
        <div className="flex gap-4">
          <button className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
            Информация
          </button>
          <button className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black">
            Друзья
          </button>
        </div>
      </div>

      {/* Profile Picture Section */}
      <div className="relative">
        <div className="relative h-60 bg-gradient-to-br from-purple-400 to-pink-300">
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

          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50">
              <Settings className="h-4 w-4 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4">
        <div className="text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <h2 className="text-xl font-bold text-black">{user?.name}</h2>
            <div className="flex items-center">
              <Star className="h-5 w-5 fill-blue-500 text-blue-500" />
            </div>
          </div>
          <p className="text-sm text-gray-500">г. Караганда, 35 лет</p>
        </div>
      </div>

      {/* Digital Avatar Card */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-5">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-purple-600" />
            <span className="text-base font-medium text-black">Цифровой аватар</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 px-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-yellow-400 p-3 shadow-sm">
            <div className="mb-1 text-center text-xl font-bold text-black">0</div>
            <div className="flex items-center justify-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded bg-yellow-600">
                <div className="h-2 w-2 rounded-sm bg-yellow-800"></div>
              </div>
              <span className="text-sm text-black">Квесты</span>
            </div>
          </div>
          <div className="rounded-xl bg-purple-600 p-3 shadow-sm">
            <div className="mb-1 text-center text-xl font-bold text-white">0</div>
            <div className="flex items-center justify-center gap-1">
              <div className="h-4 w-4 rounded-full bg-orange-400"></div>
              <span className="text-sm text-white">Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interests Section */}
      <div className="mx-4 mb-6">
        <div className="mb-3 flex items-center justify-between py-3">
          <h3 className="text-xl font-bold text-black">Интересы</h3>
          <Edit className="h-5 w-5 text-black" />
        </div>
        <div className="">
          <p className="text-sm leading-relaxed text-black">
            Привет! Днём я дизайнер, вечером тренер по американскому футболу, ночью веду
            свой паблик по спортивному дизайну и 27/4 любящий муж. Вот такое вот описание.
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mb-6">
        <div className="space-y-0">
          <MenuItem
            icon={<BarChart3 className="h-6 w-6 text-purple-300" />}
            title="Ваши навыки"
          />
          <MenuItem
            icon={<Award className="h-6 w-6 text-purple-300" />}
            title="Достижения"
          />
          <MenuItem
            icon={<Calendar className="h-6 w-6 text-purple-300" />}
            title="Календарь"
          />
          <MenuItem
            icon={<History className="h-6 w-6 text-purple-300" />}
            title="История"
          />
          <MenuItem
            icon={<Package className="h-6 w-6 text-purple-300" />}
            title="Инвентарь"
          />
        </div>
      </div>

      {/* Bottom padding to account for fixed navigation */}
      <div className="h-16"></div>
    </div>
  );
}

function MenuItem({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-5 last:border-b-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-base font-medium text-black">{title}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </div>
  );
}
