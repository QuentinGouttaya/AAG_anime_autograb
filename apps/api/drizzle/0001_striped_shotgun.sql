ALTER TABLE "series" ADD COLUMN "episode_count" integer;--> statement-breakpoint
ALTER TABLE "series" ADD COLUMN "genres" text[] DEFAULT '{}' NOT NULL;