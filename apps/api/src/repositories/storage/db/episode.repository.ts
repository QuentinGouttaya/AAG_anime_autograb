// storage/subscription-episode.repository.ts
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { subscriptionEpisodes } from './schema.js';
import type { SubscriptionEpisode, SubscriptionEpisodeRepository, EpisodeStatus } from './subscription_episode.repository.js';

function toEntry(row: typeof subscriptionEpisodes.$inferSelect): SubscriptionEpisode {
  return {
    subscriptionId: row.subscriptionId,
    episodeId: row.episodeId,
    status: row.status as EpisodeStatus,
    grabbedAt: row.grabbedAt ? row.grabbedAt.toISOString() : null,
  };
}

export class PostgresSubscriptionEpisodeRepository implements SubscriptionEpisodeRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async findBySubscriptionId(subscriptionId: number): Promise<SubscriptionEpisode[]> {
    const rows = await this.db
      .select()
      .from(subscriptionEpisodes)
      .where(eq(subscriptionEpisodes.subscriptionId, subscriptionId));
    return rows.map(toEntry);
  }

  async findByStatus(status: EpisodeStatus): Promise<SubscriptionEpisode[]> {
    const rows = await this.db.select().from(subscriptionEpisodes).where(eq(subscriptionEpisodes.status, status));
    return rows.map(toEntry);
  }

  async upsert(entry: SubscriptionEpisode): Promise<SubscriptionEpisode> {
    const [row] = await this.db
      .insert(subscriptionEpisodes)
      .values({
        subscriptionId: entry.subscriptionId,
        episodeId: entry.episodeId,
        status: entry.status,
        grabbedAt: entry.grabbedAt ? new Date(entry.grabbedAt) : null,
      })
      .onConflictDoUpdate({
        target: [subscriptionEpisodes.subscriptionId, subscriptionEpisodes.episodeId],
        set: { status: entry.status, grabbedAt: entry.grabbedAt ? new Date(entry.grabbedAt) : null },
      })
      .returning();
    return toEntry(row);
  }
}
