CREATE TABLE "active_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(255),
	"eventId" bigint,
	"name" varchar(255),
	"userId" bigint,
	"isCompleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"event_id" bigint,
	"meet_id" bigint,
	"event_type" varchar(255),
	"date" timestamp,
	"is_ticket" boolean DEFAULT false,
	"is_planned" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"description" varchar(2000),
	"photo" varchar(255),
	"items" jsonb DEFAULT '[]'::jsonb,
	"price" integer,
	"is_with_key" boolean DEFAULT false,
	"event_type" varchar(255),
	"event_id" bigint,
	"rarity" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"types" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" bigint,
	"to_user_id" bigint,
	"complaint" varchar(255),
	"from_user_id" bigint,
	"created_at" timestamp DEFAULT now(),
	"name" varchar(255),
	"meet_id" bigint,
	"type" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"description" varchar(2000),
	"date" varchar(255),
	"location" varchar(255),
	"price" bigint,
	"type" varchar(255),
	"category" varchar(255),
	"organizer" varchar(255),
	"image" varchar(255),
	"is_series" boolean DEFAULT false,
	"has_achievement" boolean DEFAULT false,
	"stages" jsonb,
	"rewards" jsonb,
	"achievements" jsonb,
	"skills" jsonb,
	"quests" jsonb,
	"created_at" timestamp DEFAULT now(),
	"is_reviewed" boolean DEFAULT false,
	"is_approved" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "fast_meet_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"meet_id" bigint,
	"user_id" bigint,
	"status" varchar(32) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fast_meets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"description" varchar(1024),
	"user_id" bigint,
	"coordinates" jsonb,
	"city" varchar(255),
	"locations" jsonb,
	"type" varchar(255),
	"sub_type" varchar(255),
	"tags" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" bigint,
	"to_user_id" bigint,
	"created_at" timestamp DEFAULT now(),
	"photo" varchar(255),
	"event_id" bigint,
	"meet_id" bigint,
	"type" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "friend_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" bigint,
	"to_user_id" bigint,
	"status" varchar(32) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"event_id" bigint,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"description" varchar(2000),
	"case_id" bigint,
	"photo" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "link_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(6) NOT NULL,
	"supabase_id" varchar(36) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "link_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "logging" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"event_id" bigint,
	"event_type" varchar(255),
	"meet_id" bigint,
	"case_id" bigint,
	"item_id" bigint,
	"key_id" bigint,
	"amount" integer,
	"type" varchar(255),
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meet_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"meet_id" bigint,
	"fast_meet_id" bigint,
	"user_id" bigint,
	"message" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meet_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" bigint,
	"to_user_id" bigint,
	"status" varchar(32) DEFAULT 'pending',
	"meet_id" bigint,
	"is_request" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"description" varchar(1024),
	"type" varchar(255),
	"participantsIds" jsonb DEFAULT '[]'::jsonb,
	"locations" jsonb,
	"important" varchar(255),
	"date" varchar(255),
	"reward" integer,
	"items" jsonb,
	"image" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"user_id" bigint,
	"is_completed" boolean DEFAULT false,
	"max_participants" integer,
	"gallery" jsonb,
	"sub_type" varchar(255),
	"is_big" boolean DEFAULT false,
	"time" varchar(255),
	"city" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"to_user_id" bigint,
	"from_user_id" bigint,
	"type" varchar(255),
	"is_read" boolean DEFAULT false,
	"meet_id" bigint,
	"event_id" bigint,
	"is_request" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "private_access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" bigint,
	"requester_id" bigint,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "private_access_requests_owner_id_requester_id_unique" UNIQUE("owner_id","requester_id")
);
--> statement-breakpoint
CREATE TABLE "private_profile_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" bigint,
	"allowed_user_id" bigint,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "private_profile_access_owner_id_allowed_user_id_unique" UNIQUE("owner_id","allowed_user_id")
);
--> statement-breakpoint
CREATE TABLE "ratings_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"rating" integer,
	"from_user_id" bigint,
	"meet_id" bigint,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" bigint,
	"user_id" bigint,
	"review" varchar(255),
	"rating" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "selling" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"type" varchar(255),
	"event_id" bigint,
	"event_type" varchar(255),
	"amount" integer,
	"price" integer,
	"status" varchar(255) DEFAULT 'selling',
	"buyers_ids" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" bigint,
	"target_user_id" bigint,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"task_id" varchar(255),
	"progress" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" bigint,
	"to_user_id" bigint,
	"type_of_giving" varchar(255),
	"event_id_of_giving" bigint,
	"event_type_of_giving" varchar(255),
	"case_id_of_giving" bigint,
	"item_id_of_giving" bigint,
	"amount_of_giving" integer,
	"type_of_receiving" varchar(255),
	"event_id_of_receiving" bigint,
	"event_type_of_receiving" varchar(255),
	"case_id_of_receiving" bigint,
	"item_id_of_receiving" bigint,
	"amount_of_receiving" integer,
	"status" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "supabase_id" varchar(36);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "surname" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "login" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birthday" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "inventory" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "balance" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sex" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gallery" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_onboarded" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "not_interested_ids" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "saved_ids" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "saved_events" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "saved_meets_ids" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "coordinates" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_location_update" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "warning" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bans" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_check_in" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "check_in_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "achievements" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "skills" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_private" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_supabase_id_unique" UNIQUE("supabase_id");