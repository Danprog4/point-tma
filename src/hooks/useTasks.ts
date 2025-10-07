import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/init/react";

export function useTasks() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [checkingTaskId, setCheckingTaskId] = useState<string | null>(null);

  const { data: tasksProgress } = useQuery(trpc.tasks.getTasksProgress.queryOptions());

  const startTask = useMutation(
    trpc.tasks.startTask.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.setQueryData(trpc.tasks.getTasksProgress.queryKey(), (old: any) => {
          if (!old)
            return [{ taskId: variables.taskId, progress: 0, isCompleted: false }];
          return [...old, { taskId: variables.taskId, progress: 0, isCompleted: false }];
        });
      },
    }),
  );

  const checkTask = useMutation(
    trpc.tasks.checkTask.mutationOptions({
      onSuccess: (isCompleted, variables) => {
        if (isCompleted) {
          queryClient.setQueryData(trpc.tasks.getTasksProgress.queryKey(), (old: any) => {
            if (!old) return old;
            return old.map((task: any) => {
              if (task.taskId === variables.taskId) {
                return { ...task, isCompleted: true };
              }
              return task;
            });
          });

          setCheckingTaskId(null);
          queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
          toast.success("Задание выполнено! Награда получена!");
        } else {
          setCheckingTaskId(null);
          toast.error("Задание еще не выполнено!");
        }
      },
      onError: () => {
        setCheckingTaskId(null);
        toast.error("Не удалось проверить задание!");
      },
    }),
  );

  const handleTaskAction = (
    taskId: string,
    isStarted: boolean,
    isCompleted: boolean,
    progress: number,
    total: number,
    action: () => void,
  ) => {
    if (!isStarted) {
      startTask.mutate({ taskId });
      return;
    }

    if (!isCompleted && isStarted && progress >= total) {
      setCheckingTaskId(taskId);
      checkTask.mutate({ taskId });
      return;
    }

    if (!isCompleted && isStarted && progress < total) {
      action();
    }
  };

  const getTasksWithProgress = (tasks: any[]) => {
    return tasks.map((task) => {
      const taskProgress = tasksProgress?.find((t) => t.taskId === task.id);
      return {
        ...task,
        progress: taskProgress?.progress,
        isCompleted: taskProgress?.isCompleted,
        isStarted: !!taskProgress,
      };
    });
  };

  const getButtonText = (task: {
    isCompleted?: boolean;
    isStarted: boolean;
    progress?: number;
    total?: number;
  }) => {
    if (task.isCompleted && task.isStarted) return "Выполнено";
    if (task.isStarted && !task.progress) return "Выполнить";
    if (task.isStarted && task.progress && task.total && task.progress >= task.total) {
      return "Проверить";
    }
    return "Начать";
  };

  const completedTasksCount = () => {
    return tasksProgress?.filter((task) => task.isCompleted).length || 0;
  };

  return {
    tasksProgress,
    checkingTaskId,
    handleTaskAction,
    getTasksWithProgress,
    getButtonText,
    completedTasksCount,
  };
}
