import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTRPC } from "~/trpc/init/react";

export const useActivate = () => {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const activateEvent = useMutation(trpc.event.buyEvent.mutationOptions());

  const useActivateEvent = (eventId: number, name: string) => {
    activateEvent.mutate({ id: eventId, name });
    navigate({ to: "/all/$name", params: { name } });
  };

  return { useActivateEvent };
};
