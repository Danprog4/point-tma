import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "~/trpc/init/react";

export const useActivate = () => {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const activateQuest = useMutation(trpc.quest.activateQuest.mutationOptions());

  const useActivateQuest = (questId: number) => {
    activateQuest.mutate({ questId });
    navigate({ to: "/quests" });
  };

  return { useActivateQuest };
};
