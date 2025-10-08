import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { useRef } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { ReferralCard, TaskCard } from "~/components/tasks";
import { getTasks } from "~/config/tasks";
import { usePlatform } from "~/hooks/usePlatform";
import { useReferral } from "~/hooks/useReferral";
import { useTasks } from "~/hooks/useTasks";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/tasks")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const isMobile = usePlatform();

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: referrals } = useQuery(trpc.main.getReferrals.queryOptions());

  const {
    checkingTaskId,
    handleTaskAction,
    getTasksWithProgress,
    getButtonText,
    completedTasksCount,
  } = useTasks();

  const { copiedLink, handleShare, handleCopyLink } = useReferral(user?.id);

  const tasks = getTasks(navigate);
  const tasksWithInfo = getTasksWithProgress(tasks);

  // Create ref for info section
  const infoSectionRef = useRef<HTMLDivElement>(null);

  // Handler to scroll to info section
  const handleScrollToInfo = () => {
    if (infoSectionRef.current) {
      infoSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

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
        <ReferralCard
          onScrollToInfo={handleScrollToInfo}
          referralsCount={referrals?.length || 0}
          completedTasksCount={completedTasksCount()}
          copiedLink={copiedLink}
          onShare={handleShare}
          onCopyLink={handleCopyLink}
        />

        {/* Tasks Section */}
        <div className="mt-8 mb-2">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-purple-600" />
            <h3 className="text-xl font-bold text-gray-900">Задания</h3>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Выполняйте задания и получайте дополнительные награды
          </p>

          <div className="space-y-3">
            {tasksWithInfo.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                checkingTaskId={checkingTaskId}
                onAction={handleTaskAction}
                getButtonText={getButtonText}
              />
            ))}
          </div>
        </div>

        <p className="text-sm font-medium text-purple-600">
          Не забывайте заходить каждый день и получать ежедневные награды!
        </p>

        {/* Info Section */}
        <div
          ref={infoSectionRef}
          className="mt-6 rounded-2xl border-2 border-purple-100 bg-purple-50 p-4"
        >
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
