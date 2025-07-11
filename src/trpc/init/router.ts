import { authRouter } from "../auth";
import { eventRouter } from "../event";
import { friendsRouter } from "../friends";
import { router } from "../main";
import { meetingRouter } from "../meetings";
import { createTRPCRouter } from "./index";
export const trpcRouter = createTRPCRouter({
  main: router,
  auth: authRouter,
  event: eventRouter,
  friends: friendsRouter,
  meetings: meetingRouter,
});

export type TRPCRouter = typeof trpcRouter;
