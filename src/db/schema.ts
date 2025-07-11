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
  surname: varchar("surname", { length: 255 }),
  login: varchar("login", { length: 255 }),
  birthday: varchar("birthday", { length: 255 }),
  city: varchar("city", { length: 255 }),
  interests: varchar("interests", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  bio: varchar("bio", { length: 255 }),
  inventory: jsonb("inventory")
    .$type<Array<{ type: string; eventId: number; isActive?: boolean; name: string }>>()
    .default([]),
  balance: integer("balance").default(0),
  sex: varchar("sex", { length: 255 }),
  photo: varchar("photo", { length: 255 }),
  gallery: jsonb("gallery").$type<string[]>(),
});

export const meetTable = pgTable("meets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 255 }),
  type: varchar("type", { length: 255 }),
  invited: jsonb("invited").$type<string[]>(),
  locations: jsonb("locations").$type<string[]>(),
  numberOfParticipants: integer("number_of_participants"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activeEventsTable = pgTable("active_events", {
  id: serial("id").primaryKey(),
  eventId: bigint("eventId", { mode: "number" }),
  name: varchar("name", { length: 255 }),
  userId: bigint("userId", { mode: "number" }),
  isCompleted: boolean("isCompleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const friendRequestsTable = pgTable("friend_requests", {
  id: serial("id").primaryKey(),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  toUserId: bigint("to_user_id", { mode: "number" }),
  status: varchar("status", { length: 32 }).default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  subscriberId: bigint("subscriber_id", { mode: "number" }),
  targetUserId: bigint("target_user_id", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  toUserId: bigint("to_user_id", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  eventId: bigint("event_id", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
});
