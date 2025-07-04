import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey(),
  referrerId: bigint("referrerId", { mode: "number" }),
  photoUrl: varchar("photoUrl", { length: 255 }),
  name: varchar("name", { length: 255 }),
  age: integer("age"),
  city: varchar("city", { length: 255 }),
  interests: varchar("interests", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  bio: varchar("bio", { length: 255 }),
  inventory: jsonb("inventory")
    .$type<Array<{ type: string; questId: number; isActive?: boolean }>>()
    .default([]),
  balance: integer("balance").default(0),
});

export const activeQuestsTable = pgTable("active_quests", {
  id: serial("id").primaryKey(),
  questId: bigint("questId", { mode: "number" }),
  userId: bigint("userId", { mode: "number" }),
  isCompleted: boolean("isCompleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
