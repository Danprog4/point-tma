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
  notInterestedIds: jsonb("not_interested_ids").$type<number[]>(),
  savedIds: jsonb("saved_ids").$type<number[]>(),
  savedEvents: jsonb("saved_events").$type<
    Array<{
      type: string;
      eventId: number;
    }>
  >(),
  savedMeetsIds: jsonb("saved_meets_ids").$type<number[]>(),
  coordinates: jsonb("coordinates").$type<[number, number]>(),
  lastLocationUpdate: timestamp("last_location_update"),
});

export const fastMeetTable = pgTable("fast_meets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 1024 }),
  userId: bigint("user_id", { mode: "number" }),
  coordinates: jsonb("coordinates").$type<[number, number]>(),
  city: varchar("city", { length: 255 }),
  locations: jsonb("locations").$type<
    Array<{
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      coordinates: [number, number];
    }>
  >(),
  type: varchar("type", { length: 255 }),
  subType: varchar("sub_type", { length: 255 }),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fastMeetParticipantsTable = pgTable("fast_meet_participants", {
  id: serial("id").primaryKey(),
  meetId: bigint("meet_id", { mode: "number" }),
  userId: bigint("user_id", { mode: "number" }),
  status: varchar("status", { length: 32 }).default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const calendarTable = pgTable("calendar", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  eventId: bigint("event_id", { mode: "number" }),
  meetId: bigint("meet_id", { mode: "number" }),
  eventType: varchar("event_type", { length: 255 }), // квест, кино, конференция, вечеринка, нетворкинг и т.д.
  date: timestamp("date"),
  isTicket: boolean("is_ticket").default(false),
  isPlanned: boolean("is_planned").default(false),
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
  description: varchar("description", { length: 1024 }),
  type: varchar("type", { length: 255 }),
  participantsIds: jsonb("participantsIds").$type<number[]>().default([]),
  locations: jsonb("locations").$type<
    Array<{
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
    }>
  >(),
  important: varchar("important", { length: 255 }),
  date: varchar("date", { length: 255 }),
  reward: integer("reward"),
  items: jsonb("items").$type<
    Array<{
      type: string;
      eventId: number;
      isActive?: boolean;
      name: string;
      id?: number;
    }>
  >(),
  image: varchar("image", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  userId: bigint("user_id", { mode: "number" }),
  isCompleted: boolean("is_completed").default(false),
  maxParticipants: integer("max_participants"),
  gallery: jsonb("gallery").$type<string[]>(),
  subType: varchar("sub_type", { length: 255 }),
  isBig: boolean("is_big").default(false),
  time: varchar("time", { length: 255 }),
  city: varchar("city", { length: 255 }),
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
  isRequest: boolean("is_request").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }),
  toUserId: bigint("to_user_id", { mode: "number" }),
  complaint: varchar("complaint", { length: 255 }),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow(),
  name: varchar("name", { length: 255 }),
  meetId: bigint("meet_id", { mode: "number" }),
  type: varchar("type", { length: 255 }), // event, user
});

export const meetParticipantsTable = pgTable("meet_participants", {
  id: serial("id").primaryKey(),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  toUserId: bigint("to_user_id", { mode: "number" }),
  status: varchar("status", { length: 32 }).default("pending"), // pending, accepted, rejected
  meetId: bigint("meet_id", { mode: "number" }),
  isRequest: boolean("is_request").default(false),
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

export const meetMessagesTable = pgTable("meet_messages", {
  id: serial("id").primaryKey(),
  meetId: bigint("meet_id", { mode: "number" }),
  fastMeetId: bigint("fast_meet_id", { mode: "number" }),
  userId: bigint("user_id", { mode: "number" }),
  message: varchar("message", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Export all table types
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Meet = typeof meetTable.$inferSelect;
export type NewMeet = typeof meetTable.$inferInsert;

export type FriendRequest = typeof friendRequestsTable.$inferSelect;
export type NewFriendRequest = typeof friendRequestsTable.$inferInsert;

export type Subscription = typeof subscriptionsTable.$inferSelect;
export type NewSubscription = typeof subscriptionsTable.$inferInsert;

export type Favorite = typeof favoritesTable.$inferSelect;
export type NewFavorite = typeof favoritesTable.$inferInsert;

export type History = typeof historyTable.$inferSelect;
export type NewHistory = typeof historyTable.$inferInsert;

export type MeetMessage = typeof meetMessagesTable.$inferSelect;
export type NewMeetMessage = typeof meetMessagesTable.$inferInsert;

export type FastMeet = typeof fastMeetTable.$inferSelect;
export type NewFastMeet = typeof fastMeetTable.$inferInsert;
export type FastMeetParticipant = typeof fastMeetParticipantsTable.$inferSelect;
