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
        caseId?: number;
        eventId?: number;
        eventType?: string;
        isActive?: boolean;
        name?: string;
        id?: number;
        isInTrade?: boolean;
        index?: number;
        isInSelling?: boolean;
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
  warnings: jsonb("warning").$type<
    {
      reason: string;
      createdAt: string;
    }[]
  >(),
  bans: jsonb("bans").$type<
    {
      userId: number;
    }[]
  >(),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  lastLogin: timestamp("last_login"),
  lastCheckIn: timestamp("last_check_in"),
  checkInStreak: integer("check_in_streak").default(0),
  achievements: jsonb("achievements").$type<Array<any>>(),
  skills: jsonb("skills").$type<Array<{ [skill: string]: number }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  isPrivate: boolean("is_private").default(false),
});

export const tasksProgressTable = pgTable("tasks_progress", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  taskId: varchar("task_id", { length: 255 }),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
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
      index: number;
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

// export const questsTable = pgTable("quests", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }),
//   description: varchar("description", { length: 1024 }),
//   category: varchar("category", { length: 255 }),
//   type: varchar("type", { length: 255 }),
//   rewards: jsonb("rewards").$type<
//     Array<{
//       type: string;
//       value: number;
//     }>
//   >(),
//   date: varchar("date", { length: 255 }),
//   location: varchar("location", { length: 255 }),
//   price: integer("price"),
//   quests: jsonb("quests").$type<any[]>(),
//   stages: jsonb("stages").$type<
//     Array<{
//       title: string;
//       desc: string;
//     }>
//   >(),
//   hasAchievement: boolean("has_achievement").default(false),
//   organizer: varchar("organizer", { length: 255 }),
//   city: varchar("city", { length: 255 }),
//   image: varchar("image", { length: 255 }),
//   isReviewed: boolean("is_reviewed").default(false),
//   isApproved: boolean("is_approved").default(false),
//   createdAt: timestamp("created_at").defaultNow(),
// });

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  eventId: bigint("event_id", { mode: "number" }),
  userId: bigint("user_id", { mode: "number" }),
  review: varchar("review", { length: 255 }),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationTable = pgTable("notification", {
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

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  description: varchar("description", { length: 2000 }),
  date: varchar("date", { length: 255 }),
  location: varchar("location", { length: 255 }),
  price: bigint("price", { mode: "number" }),
  type: varchar("type", { length: 255 }),
  category: varchar("category", { length: 255 }),
  organizer: varchar("organizer", { length: 255 }),
  image: varchar("image", { length: 255 }),
  isSeries: boolean("is_series").default(false),
  hasAchievement: boolean("has_achievement").default(false),
  stages: jsonb("stages").$type<Array<{ title: string; desc: string }>>(),
  rewards:
    jsonb("rewards").$type<
      Array<{ type: string; value?: number | string; eventId?: number; caseId?: number }>
    >(),
  achievements: jsonb("achievements").$type<Array<any>>(),
  skills: jsonb("skills").$type<Array<{ [skill: string]: number }>>(),
  quests: jsonb("quests").$type<Array<any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  isReviewed: boolean("is_reviewed").default(false),
  isApproved: boolean("is_approved").default(false),
});

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 2000 }),
  photo: varchar("photo", { length: 255 }),
  items: jsonb("items")
    .$type<Array<{ type: string; value: number | string; rarity: string }>>()
    .default([]),
  price: integer("price"),
  isWithKey: boolean("is_with_key").default(false),
  eventType: varchar("event_type", { length: 255 }), // quest, conf, party, etc
  eventId: bigint("event_id", { mode: "number" }),
  rarity: varchar("rarity", { length: 255 }), // common, rare, epic, legendary
  createdAt: timestamp("created_at").defaultNow(),
});

export const keysTable = pgTable("keys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 2000 }),
  caseId: bigint("case_id", { mode: "number" }),
  photo: varchar("photo", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loggingTable = pgTable("logging", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  eventId: bigint("event_id", { mode: "number" }),
  eventType: varchar("event_type", { length: 255 }),
  meetId: bigint("meet_id", { mode: "number" }),
  caseId: bigint("case_id", { mode: "number" }),
  itemId: bigint("item_id", { mode: "number" }),
  keyId: bigint("key_id", { mode: "number" }),
  amount: integer("amount"),
  type: varchar("type", { length: 255 }), // buy, active, etc
  details: jsonb("details").$type<Record<string, { from: unknown; to: unknown }>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  types: jsonb("types").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  fromUserId: bigint("from_user_id", { mode: "number" }),
  toUserId: bigint("to_user_id", { mode: "number" }),
  typeOfGiving: varchar("type_of_giving", { length: 255 }), // case, item, ticket, etc...
  eventIdOfGiving: bigint("event_id_of_giving", { mode: "number" }),
  eventTypeOfGiving: varchar("event_type_of_giving", { length: 255 }), // quest, conf, party, etc
  caseIdOfGiving: bigint("case_id_of_giving", { mode: "number" }),
  itemIdOfGiving: bigint("item_id_of_giving", { mode: "number" }),
  amountOfGiving: integer("amount_of_giving"),
  typeOfReceiving: varchar("type_of_receiving", { length: 255 }), // case, item, ticket, etc...
  eventIdOfReceiving: bigint("event_id_of_receiving", { mode: "number" }),
  eventTypeOfReceiving: varchar("event_type_of_receiving", { length: 255 }), // quest, conf, party, etc
  caseIdOfReceiving: bigint("case_id_of_receiving", { mode: "number" }),
  itemIdOfReceiving: bigint("item_id_of_receiving", { mode: "number" }),
  amountOfReceiving: integer("amount_of_receiving"),
  status: varchar("status", { length: 255 }), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const sellingTable = pgTable("selling", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  type: varchar("type", { length: 255 }), // case, item, ticket, etc... now only tickets
  eventId: bigint("event_id", { mode: "number" }),
  eventType: varchar("event_type", { length: 255 }), // quest, conf, party, etc
  amount: integer("amount"),
  price: integer("price"),
  status: varchar("status", { length: 255 }).default("selling"), // selling, sold, canceled
  buyersIds: jsonb("buyers_ids").$type<Record<number, number>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const privateProfileAccessTable = pgTable(
  "private_profile_access",
  {
    id: serial("id").primaryKey(),
    ownerId: bigint("owner_id", { mode: "number" }),
    allowedUserId: bigint("allowed_user_id", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.ownerId, t.allowedUserId),
  }),
);

export const privateAccessRequestsTable = pgTable(
  "private_access_requests",
  {
    id: serial("id").primaryKey(),
    ownerId: bigint("owner_id", { mode: "number" }),
    requesterId: bigint("requester_id", { mode: "number" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    unq: unique().on(t.ownerId, t.requesterId),
  }),
);

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

export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;
export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;
export type Notification = typeof notificationTable.$inferSelect;
export type NewNotification = typeof notificationTable.$inferInsert;
export type Complaint = typeof complaintsTable.$inferSelect;
export type NewComplaint = typeof complaintsTable.$inferInsert;
export type MeetParticipant = typeof meetParticipantsTable.$inferSelect;
export type NewMeetParticipant = typeof meetParticipantsTable.$inferInsert;
export type ActiveEvent = typeof activeEventsTable.$inferSelect;
export type NewActiveEvent = typeof activeEventsTable.$inferInsert;
export type Calendar = typeof calendarTable.$inferSelect;
export type NewCalendar = typeof calendarTable.$inferInsert;
export type RatingUser = typeof ratingsUserTable.$inferSelect;
export type NewRatingUser = typeof ratingsUserTable.$inferInsert;

export type Trade = typeof tradesTable.$inferSelect;

export type PrivateProfileAccess = typeof privateProfileAccessTable.$inferSelect;
export type NewPrivateProfileAccess = typeof privateProfileAccessTable.$inferInsert;
export type PrivateAccessRequest = typeof privateAccessRequestsTable.$inferSelect;
export type NewPrivateAccessRequest = typeof privateAccessRequestsTable.$inferInsert;
