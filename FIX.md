# FIX: Убрать Supabase/Mobile авторизацию — только Telegram

Этот файл содержит исправленные версии файлов из `SETUP.md`, где убрана вся логика Supabase и мобильной авторизации. Остаётся только чистая Telegram Mini App авторизация.

---

## Что убрано

- `SUPABASE_URL` env переменная и JWKS верификация
- `Bearer` token логика (mobile auth)
- `mobileAuthMiddleware` и `mobileProcedure`
- `mobileLogin` процедура
- `telegramLinksTable` и `linkCodesTable` из схемы
- `supabaseId` поле из `usersTable`
- `generateLinkCode`, `getTelegramLinkStatus`, `clearTelegramLink` процедуры
- Весь `src/routes/api/bot.ts` (webhook для привязки аккаунтов)
- Зависимости: `grammy`, `@telegram-apps/init-data-node` остаётся (нужен для валидации initData на сервере)
- Зависимость `grammy` можно убрать, если бот не нужен

---

## .env.example

```env
DATABASE_URL=
JWT_SECRET=
BOT_TOKEN=
VITE_MOCK_INIT_DATA=
VITE_ERUDA_ENABLED=false
```

---

## package.json — убрать зависимости

Убрать из `dependencies`:
```diff
- "grammy": "^1.36.3",
```

Оставить:
```json
"@telegram-apps/init-data-node": "^2.0.8",
"@telegram-apps/sdk": "^3.10.1",
"jose": "^6.0.11",
```

---

## src/db/schema.ts

```ts
import {
  boolean,
  bigint,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey(), // Telegram ID
  referrerId: bigint("referrerId", { mode: "number" }),
  photoUrl: varchar("photoUrl", { length: 255 }),
  name: varchar("name", { length: 255 }),
  surname: varchar("surname", { length: 255 }),
  login: varchar("login", { length: 255 }),
  birthday: varchar("birthday", { length: 255 }),
  city: varchar("city", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  bio: varchar("bio", { length: 255 }),
  balance: integer("balance").default(0),
  sex: varchar("sex", { length: 255 }),
  photo: varchar("photo", { length: 255 }),
  gallery: jsonb("gallery").$type<string[]>(),
  isOnboarded: boolean("is_onboarded").default(false),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
```

---

## src/db/index.ts — без изменений

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

---

## src/trpc/init/index.ts

```ts
import { getCookie, getEvent } from "@tanstack/react-start/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const authMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const authToken = getCookie(event, "auth");

  if (!authToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No JWT token found",
    });
  }

  const { payload } = await jwtVerify(authToken, JWT_SECRET);

  if (!payload?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid JWT token",
    });
  }

  return next({
    ctx: { ...ctx, userId: payload.userId as number },
  });
});

export const procedure = t.procedure.use(authMiddleware);
```

---

## src/trpc/init/router.ts

```ts
import { authRouter } from "../auth";
import { mainRouter } from "../main";
import { createTRPCRouter } from "./index";

export const trpcRouter = createTRPCRouter({
  main: mainRouter,
  auth: authRouter,
});

export type TRPCRouter = typeof trpcRouter;
```

---

## src/trpc/init/react.tsx — без изменений

```tsx
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "./router";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
```

---

## src/trpc/auth.ts

```ts
import { getEvent, setCookie } from "@tanstack/react-start/server";
import { parse, validate } from "@telegram-apps/init-data-node";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { z } from "zod";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { publicProcedure } from "./init";

async function issueAuthCookie(userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

  const event = getEvent();
  setCookie(event, "auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return token;
}

export const authRouter = {
  login: publicProcedure
    .input(
      z.object({
        initData: z.string(),
        startParam: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Валидация initData через BOT_TOKEN
      try {
        validate(input.initData, process.env.BOT_TOKEN!, {
          expiresIn: 0,
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid init data",
        });
      }

      const parsedData = parse(input.initData);
      const telegramUser = parsedData.user;
      const referrerId = input.startParam?.split("_")[1];

      if (!telegramUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid init data",
        });
      }

      await issueAuthCookie(telegramUser.id);

      const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, telegramUser.id),
      });

      const name =
        telegramUser.first_name +
        (telegramUser.last_name ? ` ${telegramUser.last_name}` : "");

      if (!existingUser) {
        const newUser = await db
          .insert(usersTable)
          .values({
            id: telegramUser.id,
            referrerId: referrerId ? Number(referrerId) : null,
            name,
            photoUrl: telegramUser.photo_url || null,
            email: null,
            phone: null,
            bio: null,
            city: null,
            balance: 0,
            birthday: null,
            surname: null,
            sex: null,
            photo: null,
            gallery: [],
            isOnboarded: false,
            lastLogin: new Date(),
          })
          .returning();

        return newUser[0];
      }

      await db
        .update(usersTable)
        .set({ lastLogin: new Date() })
        .where(eq(usersTable.id, existingUser.id));

      return existingUser;
    }),
} satisfies TRPCRouterRecord;
```

---

## src/trpc/main.ts — без изменений

```ts
import { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { procedure } from "./init";

export const mainRouter = {
  getUser: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });
    return user ?? null;
  }),
} satisfies TRPCRouterRecord;
```

---

## src/routes/api/trpc.$.ts

```ts
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "~/trpc/init/router";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
  });
}

export const APIRoute = createAPIFileRoute("/api/trpc/$")({
  GET: handler,
  POST: handler,
});
```

---

## src/routes/api/bot.ts — УДАЛИТЬ ФАЙЛ

Этот файл больше не нужен. Весь webhook для привязки аккаунтов убран.

---

## Файлы без изменений (те же, что в SETUP.md)

- `app.config.ts`
- `tsconfig.json`
- `drizzle.config.ts`
- `src/env.ts`
- `src/client.tsx`
- `src/ssr.tsx`
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/components/AuthProvider.tsx`
- `src/trpc/init/react.tsx`

---

## Итоговая структура

```
project/
├── app.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── package.json
├── .env
├── src/
│   ├── client.tsx
│   ├── ssr.tsx
│   ├── router.tsx
│   ├── env.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── trpc/
│   │   ├── init/
│   │   │   ├── index.ts       # Только Cookie JWT middleware
│   │   │   ├── router.ts
│   │   │   └── react.tsx
│   │   ├── auth.ts            # Только Telegram login
│   │   └── main.ts
│   ├── components/
│   │   └── AuthProvider.tsx
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   └── api/
│   │       └── trpc.$.ts      # Только tRPC, без bot.ts
│   └── lib/
│       └── styles/
│           └── app.css
```

---

## ENV — финально нужно только 3 переменные

```env
DATABASE_URL=postgresql://...
JWT_SECRET=any-random-secret-string
BOT_TOKEN=123456:ABC-DEF...
```
