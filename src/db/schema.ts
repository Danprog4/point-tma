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
  interests: jsonb("interests").$type<Record<string, string>>(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 255 }),
  bio: varchar("bio", { length: 255 }),
  inventory: jsonb("inventory")
    .$type<
      Array<{
        type: string;
        eventId: number;
        isActive?: boolean;
        name: string;
        id?: number;
      }>
    >()
    .default([]),
  balance: integer("balance").default(0),
  sex: varchar("sex", { length: 255 }),
  photo: varchar("photo", { length: 255 }),
  gallery: jsonb("gallery").$type<string[]>(),
  isOnboarded: boolean("is_onboarded").default(false),
});

export const ratingsUserTable = pgTable("ratings_user", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  rating: integer("rating"),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  meetId: bigint("meet_id", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetTable = pgTable("meets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 255 }),
  type: varchar("type", { length: 255 }),
  participantsIds: jsonb("participantsIds").$type<string[]>(),
  location: varchar("location", { length: 255 }),
  reward: integer("reward"),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  userId: bigint("user_id", { mode: "number" }),
  idOfEvent: bigint("id_of_event", { mode: "number" }),
  typeOfEvent: varchar("type_of_event", { length: 255 }),
  isCustom: boolean("is_custom").default(false),
  isCompleted: boolean("is_completed").default(false),
});

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }),
  userId: bigint("user_id", { mode: "number" }),
  review: varchar("review", { length: 255 }),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  toUserId: bigint("to_user_id", { mode: "number" }),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  type: varchar("type", { length: 255 }), // like, subscribe, friend request, meet request, meet invite
  isRead: boolean("is_read").default(false),
  meetId: bigint("meet_id", { mode: "number" }),
  eventId: bigint("event_id", { mode: "number" }),
  isCreator: boolean("is_creator").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }),
  userId: bigint("user_id", { mode: "number" }),
  complaint: varchar("complaint", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name", { length: 255 }),
  meetId: bigint("meet_id", { mode: "number" }),
});

export const meetParticipantsTable = pgTable("meet_participants", {
  id: serial("id").primaryKey(),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  toUserId: bigint("to_user_id", { mode: "number" }),
  status: varchar("status", { length: 32 }).default("pending"), // pending, accepted, rejected
  meetId: bigint("meet_id", { mode: "number" }),
  isCreator: boolean("is_creator").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activeEventsTable = pgTable("active_events", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 255 }),
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
  photo: varchar("photo", { length: 255 }),
  eventId: bigint("event_id", { mode: "number" }),
  meetId: bigint("meet_id", { mode: "number" }),
  type: varchar("type", { length: 255 }), // event, user, photo
});

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  eventId: bigint("event_id", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
});
