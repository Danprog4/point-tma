import { Gift, Sparkles } from "lucide-react";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    reward: { xp: number; points: number };
    progress?: number;
    total?: number;
    isCompleted?: boolean;
    isStarted: boolean;
    action: () => void;
  };
  checkingTaskId: string | null;
  onAction: (
    taskId: string,
    isStarted: boolean,
    isCompleted: boolean,
    progress: number,
    total: number,
    action: () => void,
  ) => void;
  getButtonText: (task: {
    isCompleted?: boolean;
    isStarted: boolean;
    progress?: number;
    total?: number;
  }) => string;
}

export function TaskCard({
  task,
  checkingTaskId,
  onAction,
  getButtonText,
}: TaskCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md">
      <div className="relative p-4">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-600 to-pink-500" />

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600">
            {task.icon}
          </div>

          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-gray-900">{task.title}</h4>
            <p className="mb-3 text-sm text-gray-600">{task.description}</p>

            {task.isStarted && task.total && (
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                  <span>Прогресс</span>
                  <span>
                    {task.progress || 0}/{task.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
                    style={{
                      width: `${((task.progress || 0) / (task.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

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
                onClick={() =>
                  onAction(
                    task.id,
                    task.isStarted,
                    task.isCompleted || false,
                    task.progress || 0,
                    task.total || 0,
                    task.action,
                  )
                }
                disabled={checkingTaskId === task.id}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  task.isCompleted
                    ? "bg-green-50 text-green-600"
                    : "bg-purple-600 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                }`}
              >
                {checkingTaskId === task.id ? "Проверка..." : getButtonText(task)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
