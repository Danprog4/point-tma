import { authRouter } from "../auth";
import { crmRouter } from "../crm";
import { eventRouter } from "../event";
import { friendsRouter } from "../friends";
import { router } from "../main";
import { meetingRouter } from "../meetings";
import { yandexRouter } from "../yandex";
import { createTRPCRouter } from "./index";
export const trpcRouter = createTRPCRouter({
  main: router,
  auth: authRouter,
  event: eventRouter,
  friends: friendsRouter,
  meetings: meetingRouter,
  yandex: yandexRouter,
  crm: crmRouter,
});

export type TRPCRouter = typeof trpcRouter;
