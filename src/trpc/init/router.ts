import { authRouter } from "../auth";
import { eventRouter } from "../event";
import { router } from "../main";
import { createTRPCRouter } from "./index";
export const trpcRouter = createTRPCRouter({
  main: router,
  auth: authRouter,
  event: eventRouter,
});

export type TRPCRouter = typeof trpcRouter;
