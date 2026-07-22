// db/schema.ts
import { pgTable, serial, integer, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const series = pgTable('series', {
  id: serial('id').primaryKey(),
  anilistId: integer('anilist_id').notNull().unique(),
  canonicalTitle: text('canonical_title').notNull(),
  romajiTitle: text('romaji_title'),
  coverImage: text('cover_image'),
  status: text('status'),
  format: text('format'),
  episodeCount: integer('episode_count'),
  genres: text('genres').array().notNull().default([]),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  anilistId: integer('anilist_id').notNull().unique(),
  name: text('name').notNull(),
  isAdult: boolean('is_adult').notNull().default(false),
});

export const episodes = pgTable('episodes', {
  id: serial('id').primaryKey(),
  serieId: integer('serie_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
  episodeNumber: integer('episode_number').notNull(),
  airedAt: timestamp('aired_at'),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  seriesId: integer('series_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
  preferredFansub: text('preferred_fansub').array().notNull().default([]),
  preferredResolution: text('preferred_resolution').notNull(),
  minSeeders: integer('min_seeders').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const subscriptionEpisodes = pgTable('subscription_episodes', {
  subscriptionId: integer('subscription_id').notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  episodeId: integer('episode_id').notNull().references(() => episodes.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  grabbedAt: timestamp('grabbed_at'),
}, (table) => ({
  pk: primaryKey({ columns: [table.subscriptionId, table.episodeId] }),
}));

export const serieTags = pgTable('serie_tags', {
  serieId: integer('serie_id').notNull().references(() => series.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.serieId, table.tagId] }),
}));
