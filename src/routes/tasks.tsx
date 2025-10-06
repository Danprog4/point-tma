import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { shareURL } from "@telegram-apps/sdk";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Gift,
  Share2,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useScroll } from "~/components/hooks/useScroll";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/tasks")({
  component: RouteComponent,
});

interface Task {
  id: string;
  title: string;
  description: string;
  reward: {
    xp: number;
    points: number;
  };
  icon: React.ReactNode;
  action: () => void;
  completed: boolean;
  progress?: {
    current: number;
    total: number;
  };
}

function RouteComponent() {
  useScroll();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const isMobile = usePlatform();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = useMemo(() => {
    return `https://t.me/pointTMA_bot?startapp=ref_${user?.id || ""}`;
  }, [user?.id]);

  const referralText = `Привет! 👋 Присоединяйся к Point - приложению для интересных встреч и квестов! Используй мою ссылку для регистрации и получи бонусы! 🎁`;

  const handleShare = () => {
    if (shareURL.isAvailable()) {
      shareURL(referralLink, referralText);
    } else {
      // Fallback для веб-версии
      navigator.clipboard.writeText(`${referralText}\n\n${referralLink}`);
      toast.success("Ссылка скопирована в буфер обмена!");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Ссылка скопирована!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const tasks: Task[] = [
    {
      id: "buy-cases",
      title: "Купить 10 кейсов",
      description: "Приобретите 10 кейсов в магазине и получите награду",
      reward: {
        xp: 50,
        points: 200,
      },
      icon: <ShoppingBag className="h-6 w-6" />,
      action: () => navigate({ to: "/shop" }),
      completed: false,
      progress: {
        current: 0,
        total: 10,
      },
    },
    {
      id: "visit-shop",
      title: "Посетить магазин",
      description: "Зайдите в магазин и ознакомьтесь с ассортиментом",
      reward: {
        xp: 10,
        points: 50,
      },
      icon: <Target className="h-6 w-6" />,
      action: () => navigate({ to: "/shop" }),
      completed: false,
    },
  ];

  return (
    <div
      data-mobile={isMobile}
      className="scrollbar-hidden min-h-screen overflow-y-auto to-white pt-14 pb-20 data-[mobile=true]:pt-39"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-[1000] flex items-center justify-between bg-white px-4 py-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="flex h-8 w-8 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Задания</h1>
        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="px-4 pb-6">
        {/* Hero Section - Referral Card */}
        <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-white/90">
                Приглашай и зарабатывай
              </span>
            </div>

            <h2 className="mb-2 text-2xl font-bold text-white">Пригласи друзей</h2>
            <p className="mb-6 text-sm text-white/90">
              За каждого приглашенного друга получай бонусы!
            </p>

            {/* Rewards */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-300" />
                  <span className="text-2xl font-bold text-white">10 XP</span>
                </div>
                <span className="text-xs text-white/80">За каждого друга</span>
              </div>
              <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-1">
                  <Gift className="h-4 w-4 text-yellow-300" />
                  <span className="text-2xl font-bold text-white">100</span>
                </div>
                <span className="text-xs text-white/80">Поинтов</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-purple-600 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Share2 className="h-5 w-5" />
                Пригласить друга
              </button>

              <button
                onClick={handleCopyLink}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Скопировано!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Скопировать ссылку
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-purple-600">0</div>
            <div className="text-xs text-gray-600">Приглашено</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-green-600">0</div>
            <div className="text-xs text-gray-600">Активных</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-1 text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs text-gray-600">Заработано</div>
          </div>
        </div> */}

        {/* Tasks Section */}
        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Задания</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Выполняйте задания и получайте дополнительные награды
          </p>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative p-4">
                  {/* Gradient accent line */}
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-600 to-pink-500" />

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600">
                      {task.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="mb-1 font-semibold text-gray-900">{task.title}</h4>
                      <p className="mb-3 text-sm text-gray-600">{task.description}</p>

                      {/* Progress bar */}
                      {task.progress && (
                        <div className="mb-3">
                          <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                            <span>Прогресс</span>
                            <span>
                              {task.progress.current}/{task.progress.total}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
                              style={{
                                width: `${(task.progress.current / task.progress.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Rewards and Action */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1">
                            <Sparkles className="h-3 w-3 text-purple-600" />
                            <span className="text-xs font-semibold text-purple-600">
                              +{task.reward.xp} XP
                            </span>
                          </div>
                          <div className="flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1">
                            <Gift className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-semibold text-yellow-600">
                              +{task.reward.points}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={task.action}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            task.completed
                              ? "bg-green-50 text-green-600"
                              : "bg-purple-600 text-white hover:bg-purple-700"
                          }`}
                        >
                          {task.completed ? "Выполнено" : "Выполнить"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 rounded-2xl border-2 border-purple-100 bg-purple-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900">Как это работает?</h4>
          </div>
          <ul className="space-y-2 text-sm text-purple-800">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-purple-600">•</span>
              <span>Делитесь своей реферальной ссылкой с друзьями</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-purple-600">•</span>
              <span>
                Когда друг регистрируется по вашей ссылке, вы оба получаете бонусы
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-purple-600">•</span>
              <span>Чем больше активных рефералов, тем больше наград</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
