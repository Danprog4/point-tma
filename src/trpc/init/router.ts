import { authRouter } from "../auth";
import { casesRouter } from "../cases";
import { crmRouter } from "../crm";
import { eventRouter } from "../event";
import { friendsRouter } from "../friends";
import { router } from "../main";
import { marketRouter } from "../market";
import { meetingRouter } from "../meetings";
import { tasksRouter } from "../tasks";
import { tradesRouter } from "../trades";
import { yandexRouter } from "../yandex";
import { createTRPCRouter } from "./index";

export const trpcRouter = createTRPCRouter({
  main: router,
  auth: authRouter,
  event: eventRouter,
  friends: friendsRouter,
  meetings: meetingRouter,
  yandex: yandexRouter,
  cases: casesRouter,
  crm: crmRouter,
  tasks: tasksRouter,
  trades: tradesRouter,
  market: marketRouter,
});

export type TRPCRouter = typeof trpcRouter;
