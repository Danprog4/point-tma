# TanStack Start + Telegram Auth + tRPC + Drizzle — Full Setup Guide

Полное руководство для создания нового проекта на стеке:
- **TanStack Start** (фреймворк)
- **tRPC v11** (API)
- **React Query v5** (кэширование)
- **Drizzle ORM** (база данных PostgreSQL)
- **Telegram Mini App авторизация** (через `@telegram-apps/sdk`)
- **Supabase JWT** (мобильная авторизация)
- **SuperJSON** (сериализация)

---

## 1. Инициализация проекта

### package.json (ключевые зависимости)

```json
{
  "name": "tanstarter",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  },
  "dependencies": {
    "@t3-oss/env-core": "^0.13.4",
    "@tanstack/react-query": "^5.72.0",
    "@tanstack/react-router": "^1.115.0",
    "@tanstack/react-router-with-query": "^1.115.0",
    "@tanstack/react-start": "^1.115.1",
    "@telegram-apps/init-data-node": "^2.0.8",
    "@telegram-apps/sdk": "^3.10.1",
    "@trpc/client": "11.8.1",
    "@trpc/server": "11.8.1",
    "@trpc/tanstack-react-query": "11.8.1",
    "drizzle-orm": "^0.45.1",
    "grammy": "^1.36.3",
    "jose": "^6.0.11",
    "postgres": "^3.4.7",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "sonner": "^2.0.6",
    "superjson": "^2.2.2",
    "vinxi": "^0.5.3",
    "zod": "^3.24.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.3",
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.1",
    "babel-plugin-react-compiler": "latest",
    "drizzle-kit": "^0.31.1",
    "tailwindcss": "^4.1.3",
    "typescript": "^5.8.3",
    "vite-tsconfig-paths": "^5.1.4"
  }
}
```

---

## 2. Конфигурационные файлы

### app.config.ts

```ts
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }) as any,
      tailwindcss() as any,
    ],
  },

  react: {
    babel: {
      plugins: [
        [
          "babel-plugin-react-compiler",
          {
            target: "19",
          },
        ],
      ],
    },
  },

  tsr: {
    appDirectory: "./src",
  },

  server: {
    preset: "vercel",
  },
});
```

### tsconfig.json

```json
{
  "include": ["**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./src/*"]
    },
    "noEmit": true,
    "strictNullChecks": true
  }
}
```

### .env.example

```env
DATABASE_URL=
JWT_SECRET=
SUPABASE_URL=
BOT_TOKEN=
PROD_BOT_TOKEN=
NGROK_DOMAIN=
VITE_ERUDA_ENABLED=false
```

### drizzle.config.ts

```ts
import type { Config } from "drizzle-kit";

export default {
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  breakpoints: true,
  verbose: true,
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
} satisfies Config;
```

### src/env.ts — Валидация переменных окружения

```ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]),
    NGROK_DOMAIN: z.string(),
  },

  client: {
    VITE_ERUDA_ENABLED: z.string().transform((s) => s !== "false" && s !== "0"),
  },

  clientPrefix: "VITE_",
  runtimeEnv: typeof window === "undefined" ? process.env : import.meta.env,
  emptyStringAsUndefined: true,
});
```

---

## 3. База данных (Drizzle ORM)

### src/db/index.ts

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
```

### src/db/schema.ts — Минимальная схема для авторизации

```ts
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// Основная таблица пользователей
export const usersTable = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  supabaseId: varchar("supabase_id", { length: 36 }).unique(),
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

// Связка Telegram <-> Supabase аккаунтов
export const telegramLinksTable = pgTable("telegram_links", {
  telegramId: bigint("telegram_id", { mode: "number" }).primaryKey(),
  supabaseId: varchar("supabase_id", { length: 36 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 6-значные коды для привязки аккаунтов
export const linkCodesTable = pgTable("link_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  supabaseId: varchar("supabase_id", { length: 36 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type TelegramLink = typeof telegramLinksTable.$inferSelect;
export type LinkCode = typeof linkCodesTable.$inferSelect;
```

---

## 4. tRPC — Инициализация и middleware

### src/trpc/init/index.ts

```ts
import { getCookie, getEvent } from "@tanstack/react-start/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import superjson from "superjson";

import { db } from "../../db";
import { usersTable } from "../../db/schema";

const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Supabase JWKS для верификации мобильных JWT
const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL env var");
}
const SUPABASE_JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

// Универсальный middleware: Cookie JWT (web/Telegram) + Bearer token (mobile/Supabase)
const authMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const authHeader = event.headers.get("Authorization");

  // Mobile: Bearer token (Supabase JWT)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, SUPABASE_JWKS);

      if (!payload.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Supabase JWT token",
        });
      }

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.supabaseId, payload.sub),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return next({
        ctx: { ...ctx, userId: user.id },
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Supabase JWT token",
      });
    }
  }

  // Web: Cookie JWT (Telegram)
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

// Mobile-only middleware (Bearer token, передаёт supabaseId в ctx)
const mobileAuthMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const authHeader = event.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Mobile auth required",
    });
  }

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, SUPABASE_JWKS);

    if (!payload.sub) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Supabase JWT token",
      });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.supabaseId, payload.sub),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found. Call mobileLogin first to register.",
      });
    }

    return next({
      ctx: { ...ctx, userId: user.id, supabaseId: payload.sub },
    });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Supabase JWT token",
    });
  }
});

export const procedure = t.procedure.use(authMiddleware);
export const mobileProcedure = t.procedure.use(mobileAuthMiddleware);
```

### src/trpc/init/react.tsx — React-контекст для tRPC

```tsx
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "./router";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
```

### src/trpc/init/router.ts — Агрегация роутеров

```ts
import { authRouter } from "../auth";
import { mainRouter } from "../main";
import { createTRPCRouter } from "./index";

export const trpcRouter = createTRPCRouter({
  main: mainRouter,
  auth: authRouter,
  // Добавляй свои роутеры здесь:
  // friends: friendsRouter,
  // notifications: notificationsRouter,
});

export type TRPCRouter = typeof trpcRouter;
```

---

## 5. tRPC — Auth Router (Telegram авторизация)

### src/trpc/auth.ts

```ts
import { getEvent, setCookie } from "@tanstack/react-start/server";
import { parse, validate } from "@telegram-apps/init-data-node";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq, lt, sql } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { db } from "~/db";
import { linkCodesTable, telegramLinksTable, usersTable } from "~/db/schema";
import { mobileProcedure, publicProcedure } from "./init";

const SUPABASE_URL = process.env.SUPABASE_URL;
if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL env var");
}
const SUPABASE_JWKS = createRemoteJWKSet(
  new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);
const MOBILE_USER_MAX_ID = 100_000_000;
const MOBILE_USER_ID_LOCK_KEY = 810_340_021;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
  // Telegram Web App login
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

      // Проверяем привязку Telegram -> Supabase
      const linkedTelegram = await db.query.telegramLinksTable.findFirst({
        where: eq(telegramLinksTable.telegramId, telegramUser.id),
      });

      if (linkedTelegram) {
        const linkedUser = await db.query.usersTable.findFirst({
          where: eq(usersTable.supabaseId, linkedTelegram.supabaseId),
        });

        if (linkedUser) {
          await issueAuthCookie(linkedUser.id);
          await db
            .update(usersTable)
            .set({ lastLogin: new Date() })
            .where(eq(usersTable.id, linkedUser.id));
          return linkedUser;
        }
      }

      await issueAuthCookie(telegramUser.id);

      const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, telegramUser.id),
      });

      const name =
        telegramUser.first_name +
        (telegramUser.last_name ? ` ${telegramUser.last_name}` : "");

      if (!existingUser) {
        // Создание нового пользователя
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

  // Mobile login — связка Supabase user с внутренним пользователем
  mobileLogin: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        photoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let payload;
      try {
        const result = await jwtVerify(input.token, SUPABASE_JWKS);
        payload = result.payload;
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Supabase token",
        });
      }

      if (!payload.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid token payload",
        });
      }

      const supabaseId = payload.sub;
      const now = new Date();

      return db.transaction(async (tx) => {
        const existingUser = await tx.query.usersTable.findFirst({
          where: eq(usersTable.supabaseId, supabaseId),
        });

        if (existingUser) {
          const [updatedUser] = await tx
            .update(usersTable)
            .set({ lastLogin: now })
            .where(eq(usersTable.id, existingUser.id))
            .returning();
          return updatedUser ?? { ...existingUser, lastLogin: now };
        }

        // Advisory lock для предотвращения дублирования ID
        await tx.execute(
          sql`select pg_advisory_xact_lock(${MOBILE_USER_ID_LOCK_KEY})`
        );

        const existingUserAfterLock = await tx.query.usersTable.findFirst({
          where: eq(usersTable.supabaseId, supabaseId),
        });

        if (existingUserAfterLock) {
          const [updatedUser] = await tx
            .update(usersTable)
            .set({ lastLogin: now })
            .where(eq(usersTable.id, existingUserAfterLock.id))
            .returning();
          return updatedUser ?? { ...existingUserAfterLock, lastLogin: now };
        }

        // Mobile IDs в отдельном диапазоне (< 100M), чтобы не конфликтовать с Telegram IDs
        const maxIdResult = await tx.query.usersTable.findFirst({
          where: lt(usersTable.id, MOBILE_USER_MAX_ID),
          orderBy: (users, { desc }) => [desc(users.id)],
        });
        const newId = (maxIdResult?.id ?? 0) + 1;

        if (newId >= MOBILE_USER_MAX_ID) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Mobile user id range exhausted",
          });
        }

        const [newUser] = await tx
          .insert(usersTable)
          .values({
            id: newId,
            supabaseId,
            name: input.name || null,
            email: input.email || null,
            photoUrl: input.photoUrl || null,
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
            lastLogin: now,
          })
          .returning();

        return newUser;
      });
    }),

  // Статус привязки Telegram аккаунта (для мобильного)
  getTelegramLinkStatus: mobileProcedure.query(async ({ ctx }) => {
    const link = await db.query.telegramLinksTable.findFirst({
      where: eq(telegramLinksTable.supabaseId, ctx.supabaseId),
    });
    return {
      linked: Boolean(link),
      telegramId: link?.telegramId ?? null,
    };
  }),

  // Генерация 6-значного кода для привязки аккаунтов
  generateLinkCode: mobileProcedure.mutation(async ({ ctx }) => {
    const supabaseId = ctx.supabaseId;
    await db
      .delete(linkCodesTable)
      .where(eq(linkCodesTable.supabaseId, supabaseId));

    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query.linkCodesTable.findFirst({
        where: eq(linkCodesTable.code, code),
      });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(linkCodesTable).values({ code, supabaseId, expiresAt });

    return { code, expiresAt };
  }),
} satisfies TRPCRouterRecord;
```

---

## 6. tRPC — Пример Main Router

### src/trpc/main.ts

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

## 7. API Route — tRPC Handler

### src/routes/api/trpc.$.ts

```ts
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcRouter } from "~/trpc/init/router";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: "/api/trpc",
    responseMeta({ type, errors }) {
      const headers: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-admin-password",
        "Access-Control-Max-Age": "86400",
      };

      if (request.method === "OPTIONS") {
        return { status: 200, headers };
      }

      return { headers };
    },
  });
}

export const APIRoute = createAPIFileRoute("/api/trpc/$")({
  GET: handler,
  POST: handler,
  OPTIONS: handler,
});
```

---

## 8. API Route — Telegram Bot Webhook

### src/routes/api/bot.ts

```ts
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq, and, gt } from "drizzle-orm";
import { Bot, webhookCallback } from "grammy";
import { db } from "~/db";
import { linkCodesTable, telegramLinksTable, usersTable } from "~/db/schema";

const bot = new Bot(process.env.PROD_BOT_TOKEN!);

// Обработка 6-значных кодов для привязки аккаунтов
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  if (/^\d{6}$/.test(text)) {
    const code = text;
    const telegramId = ctx.from.id;

    try {
      await db.transaction(async (tx) => {
        const linkRequest = await tx.query.linkCodesTable.findFirst({
          where: and(
            eq(linkCodesTable.code, code),
            gt(linkCodesTable.expiresAt, new Date())
          ),
        });

        if (!linkRequest) throw new Error("LINK_CODE_NOT_FOUND");

        const supabaseId = linkRequest.supabaseId;

        // Проверки one-to-one маппинга
        const linkByTelegram = await tx.query.telegramLinksTable.findFirst({
          where: eq(telegramLinksTable.telegramId, telegramId),
        });
        if (linkByTelegram && linkByTelegram.supabaseId !== supabaseId) {
          throw new Error("TELEGRAM_ALREADY_LINKED_TO_ANOTHER_SUPABASE");
        }

        const linkBySupabase = await tx.query.telegramLinksTable.findFirst({
          where: eq(telegramLinksTable.supabaseId, supabaseId),
        });
        if (linkBySupabase && linkBySupabase.telegramId !== telegramId) {
          throw new Error("SUPABASE_ALREADY_LINKED_TO_ANOTHER_TELEGRAM");
        }

        const mobileUser = await tx.query.usersTable.findFirst({
          where: eq(usersTable.supabaseId, supabaseId),
        });
        if (!mobileUser) throw new Error("MOBILE_USER_NOT_FOUND");

        const tgUser = await tx.query.usersTable.findFirst({
          where: eq(usersTable.id, telegramId),
        });

        if (tgUser) {
          if (tgUser.supabaseId && tgUser.supabaseId !== supabaseId) {
            throw new Error("TELEGRAM_ALREADY_LINKED_TO_ANOTHER_SUPABASE");
          }
          if (mobileUser.id !== telegramId) {
            const newBalance = (tgUser.balance ?? 0) + (mobileUser.balance ?? 0);
            const newXp = (tgUser.xp ?? 0) + (mobileUser.xp ?? 0);
            await tx.delete(usersTable).where(eq(usersTable.id, mobileUser.id));
            await tx
              .update(usersTable)
              .set({ supabaseId, balance: newBalance, xp: newXp, lastLogin: new Date() })
              .where(eq(usersTable.id, telegramId));
          } else {
            await tx
              .update(usersTable)
              .set({ supabaseId, lastLogin: new Date() })
              .where(eq(usersTable.id, telegramId));
          }
        } else {
          const newTelegramUser = {
            ...mobileUser,
            id: telegramId,
            supabaseId,
            lastLogin: new Date(),
          };
          await tx.delete(usersTable).where(eq(usersTable.id, mobileUser.id));
          await tx.insert(usersTable).values(newTelegramUser);
        }

        await tx
          .insert(telegramLinksTable)
          .values({ telegramId, supabaseId, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: telegramLinksTable.telegramId,
            set: { supabaseId, updatedAt: new Date() },
          });

        await tx.delete(linkCodesTable).where(eq(linkCodesTable.code, code));
      });

      return ctx.reply("✅ Аккаунты успешно связаны!");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "LINK_CODE_NOT_FOUND")
          return ctx.reply("❌ Код не найден или истёк.");
        if (error.message === "MOBILE_USER_NOT_FOUND")
          return ctx.reply("❌ Мобильный аккаунт не найден.");
        if (error.message.includes("ALREADY_LINKED"))
          return ctx.reply("❌ Аккаунт уже привязан к другому.");
      }
      return ctx.reply("❌ Произошла ошибка.");
    }
  }

  ctx.reply("Привет! Открой мини-приложение, чтобы продолжить.");
});

bot.command("start", (ctx) => {
  ctx.reply("Добро пожаловать! Открой мини-приложение, чтобы начать.");
});

const update = webhookCallback(bot, "std/http");

export const APIRoute = createAPIFileRoute("/api/bot")({
  GET: async ({ request }) => update(request),
  POST: async ({ request }) => update(request),
});
```

---

## 9. Router + React Query + tRPC Client

### src/router.tsx

```tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./trpc/init/react";
import { TRPCRouter } from "./trpc/init/router";

function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") return "";
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return `http://localhost:${process.env.PORT ?? 3000}`;
  })();
  return base + "/api/trpc";
}

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
      },
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });

  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: getUrl(),
      }),
    ],
  });

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  });

  const router = createTanStackRouter({
    defaultSsr: false,
    context: { queryClient, trpc: serverHelpers },
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    Wrap: (props) => {
      return (
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {props.children}
        </TRPCProvider>
      );
    },
  });

  return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
```

---

## 10. Entry Points

### src/client.tsx

```tsx
/// <reference types="vinxi/types/client" />
import { StartClient } from "@tanstack/react-start";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { createRouter } from "./router";

const router = createRouter();

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>
);
```

### src/ssr.tsx

```tsx
/// <reference types="vinxi/types/server" />
import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { createRouter } from "./router";

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);
```

---

## 11. Root Route + Telegram SDK Init

### src/routes/__root.tsx

```tsx
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import {
  backButton,
  init,
  mockTelegramEnv,
  requestFullscreen,
  swipeBehavior,
  viewport,
} from "@telegram-apps/sdk";
import { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "~/components/AuthProvider";
import appCss from "~/lib/styles/app.css?url";
import { useTRPC } from "~/trpc/init/react";
import { TRPCRouter } from "~/trpc/init/router";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<TRPCRouter>;
}>()({
  ssr: false,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1",
      },
      { title: "My App" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  useEffect(() => {
    // В dev-режиме мокаем Telegram окружение
    if (import.meta.env.DEV) {
      mockTelegramEnv({
        launchParams: {
          tgWebAppPlatform: "web",
          tgWebAppVersion: "8.0.0",
          tgWebAppData: import.meta.env.VITE_MOCK_INIT_DATA,
          tgWebAppThemeParams: {
            bg_color: "#17212b",
            text_color: "#f5f5f5",
            hint_color: "#708499",
            link_color: "#6ab3f3",
            button_color: "#5288c1",
            button_text_color: "#ffffff",
            secondary_bg_color: "#232e3c",
          },
        },
      });
    }

    init();
    backButton.mount();

    if (swipeBehavior.mount.isAvailable()) {
      swipeBehavior.mount();
      swipeBehavior.disableVertical();
    }

    if (viewport.expand.isAvailable()) {
      viewport.expand();
    }

    if (requestFullscreen.isAvailable()) {
      requestFullscreen();
    }

    viewport.mount().then(() => viewport.requestFullscreen());
  }, []);

  return (
    <RootDocument>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { readonly children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <Scripts />
      </body>
    </html>
  );
}
```

---

## 12. AuthProvider — Клиентская обёртка авторизации

### src/components/AuthProvider.tsx

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/init/react";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const trpc = useTRPC();
  const [initData, setInitData] = useState<string | null>(null);
  const [startParam, setStartParam] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  // Получаем данные пользователя после логина
  const userQuery = useQuery({
    ...trpc.main.getUser.queryOptions(),
    enabled: loggedIn,
  });

  const loginMutation = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: async (data) => {
        setLoggedIn(true);
        // Здесь можно prefetch необходимые данные
      },
    })
  );

  // Загружаем Telegram SDK и получаем initData
  useEffect(() => {
    const loadTelegramSDK = async () => {
      const { retrieveRawInitData, retrieveLaunchParams } = await import(
        "@telegram-apps/sdk"
      );

      const getTelegramInitData = retrieveRawInitData();
      const getTelegramLaunchParams = retrieveLaunchParams();

      setInitData(getTelegramInitData!);
      setStartParam(getTelegramLaunchParams.tgWebAppStartParam);
    };

    loadTelegramSDK();
  }, []);

  // Автоматический логин при получении initData
  useEffect(() => {
    if (!initData) return;
    loginMutation.mutate({ initData, startParam });
  }, [initData, startParam]);

  // Показываем онбординг, если пользователь не прошёл его
  if (loggedIn && userQuery.data && !userQuery.data.isOnboarded) {
    return <div>Onboarding Page</div>;
  }

  if (!loggedIn || userQuery.isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
```

---

## 13. Структура файлов

```
project/
├── app.config.ts
├── drizzle.config.ts
├── tsconfig.json
├── package.json
├── .env
├── src/
│   ├── client.tsx              # Client entry point
│   ├── ssr.tsx                 # SSR entry point
│   ├── router.tsx              # Router + QueryClient + tRPC client
│   ├── env.ts                  # Environment validation
│   ├── db/
│   │   ├── index.ts            # Database connection
│   │   └── schema.ts           # Drizzle schema
│   ├── trpc/
│   │   ├── init/
│   │   │   ├── index.ts        # tRPC init + middleware
│   │   │   ├── router.ts       # Router aggregation
│   │   │   └── react.tsx       # React context
│   │   ├── auth.ts             # Auth router
│   │   └── main.ts             # Main router (example)
│   ├── components/
│   │   └── AuthProvider.tsx     # Auth wrapper
│   ├── routes/
│   │   ├── __root.tsx           # Root layout + Telegram SDK init
│   │   ├── index.tsx            # Home page
│   │   └── api/
│   │       ├── trpc.$.ts        # tRPC API handler
│   │       └── bot.ts           # Telegram bot webhook
│   └── lib/
│       └── styles/
│           └── app.css          # Tailwind CSS
```

---

## 14. Порядок настройки

1. `bun create` или скопировать конфиги
2. `bun install`
3. Настроить `.env` (DATABASE_URL, JWT_SECRET, BOT_TOKEN, SUPABASE_URL)
4. Создать файлы DB: `src/db/index.ts`, `src/db/schema.ts`
5. `bunx drizzle-kit push` — создать таблицы
6. Создать tRPC: `src/trpc/init/index.ts`, `router.ts`, `react.tsx`
7. Создать `src/trpc/auth.ts` (авторизация)
8. Создать API routes: `src/routes/api/trpc.$.ts`, `src/routes/api/bot.ts`
9. Создать `src/router.tsx` (QueryClient + tRPC client)
10. Создать entry points: `src/client.tsx`, `src/ssr.tsx`
11. Создать `src/routes/__root.tsx` (Telegram SDK + AuthProvider)
12. Создать `src/components/AuthProvider.tsx`
13. Настроить webhook бота: `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<YOUR_URL>/api/bot`
