import { authRouter } from "../auth";
import { router } from "../main";
import { questRouter } from "../quest";
import { createTRPCRouter } from "./index";
export const trpcRouter = createTRPCRouter({
  main: router,
  auth: authRouter,
  quest: questRouter,
});

export type TRPCRouter = typeof trpcRouter;
