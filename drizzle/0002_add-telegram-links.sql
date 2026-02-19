CREATE TABLE "telegram_links" (
	"telegram_id" bigint PRIMARY KEY NOT NULL,
	"supabase_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_supabase_id_unique" UNIQUE("supabase_id");
