import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type {
  EpisodeStatus,
  SubscriptionEpisode,
} from '../../../models/subscription_episode.js';
import type { SubscriptionEpisodeRepository } from '../../subscription_episode.repository.js';

import { subscriptionEpisodes } from './schema.js';

function toEntry(
  row: typeof subscriptionEpisodes.$inferSelect,
): SubscriptionEpisode {
  return {
    subscriptionId: row.subscriptionId,
    episodeId: row.episodeId,
    status: row.status as EpisodeStatus,
    grabbedAt: row.grabbedAt?.toISOString() ?? null,
  };
}

export class PostgresSubscriptionEpisodeRepository
  implements SubscriptionEpisodeRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async findBySubscriptionId(
    subscriptionId: number,
  ): Promise<SubscriptionEpisode[]> {
    const rows = await this.db
      .select()
      .from(subscriptionEpisodes)
      .where(eq(subscriptionEpisodes.subscriptionId, subscriptionId));

    return rows.map(toEntry);
  }

  async findByStatus(
    status: EpisodeStatus,
  ): Promise<SubscriptionEpisode[]> {
    const rows = await this.db
      .select()
      .from(subscriptionEpisodes)
      .where(eq(subscriptionEpisodes.status, status));

    return rows.map(toEntry);
  }

  async upsert(
    entry: SubscriptionEpisode,
  ): Promise<SubscriptionEpisode> {
    const grabbedAt = entry.grabbedAt
      ? new Date(entry.grabbedAt)
      : null;

    const [row] = await this.db
      .insert(subscriptionEpisodes)
      .values({
        subscriptionId: entry.subscriptionId,
        episodeId: entry.episodeId,
        status: entry.status,
        grabbedAt,
      })
      .onConflictDoUpdate({
        target: [
          subscriptionEpisodes.subscriptionId,
          subscriptionEpisodes.episodeId,
        ],
        set: {
          status: entry.status,
          grabbedAt,
        },
      })
      .returning();

    return toEntry(row);
  }

  async delete(
    subscriptionId: number,
    episodeId: number,
  ): Promise<void> {
    await this.db
      .delete(subscriptionEpisodes)
      .where(
        and(
          eq(subscriptionEpisodes.subscriptionId, subscriptionId),
          eq(subscriptionEpisodes.episodeId, episodeId),
        ),
      );
  }
}
