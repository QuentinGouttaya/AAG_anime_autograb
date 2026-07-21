CREATE TABLE "episodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"serie_id" integer NOT NULL,
	"episode_number" integer NOT NULL,
	"aired_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "serie_tags" (
	"serie_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "serie_tags_serie_id_tag_id_pk" PRIMARY KEY("serie_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" serial PRIMARY KEY NOT NULL,
	"anilist_id" integer NOT NULL,
	"canonical_title" text NOT NULL,
	CONSTRAINT "series_anilist_id_unique" UNIQUE("anilist_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_episodes" (
	"subscription_id" integer NOT NULL,
	"episode_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"grabbed_at" timestamp,
	CONSTRAINT "subscription_episodes_subscription_id_episode_id_pk" PRIMARY KEY("subscription_id","episode_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"series_id" integer NOT NULL,
	"preferred_fansub" text[] DEFAULT '{}' NOT NULL,
	"preferred_resolution" text NOT NULL,
	"min_seeders" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"anilist_id" integer NOT NULL,
	"name" text NOT NULL,
	"is_adult" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tags_anilist_id_unique" UNIQUE("anilist_id")
);
--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_serie_id_series_id_fk" FOREIGN KEY ("serie_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_tags" ADD CONSTRAINT "serie_tags_serie_id_series_id_fk" FOREIGN KEY ("serie_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serie_tags" ADD CONSTRAINT "serie_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_episodes" ADD CONSTRAINT "subscription_episodes_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_episodes" ADD CONSTRAINT "subscription_episodes_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;