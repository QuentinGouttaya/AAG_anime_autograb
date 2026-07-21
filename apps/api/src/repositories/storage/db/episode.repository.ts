// src/repositories/storage/db/episode.repository.ts
import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type { Episode } from '../../../models/episode.js';
import type { EpisodeRepository } from '../../episode.repository.js';

import { episodes } from './schema.js';

function toEpisode(row: typeof episodes.$inferSelect): Episode {
  return {
    id: row.id,
    serieId: row.serieId,
    episodeNumber: row.episodeNumber,
    airedAt: row.airedAt,
  };
}

export class PostgresEpisodeRepository implements EpisodeRepository {
  constructor(private readonly db: NodePgDatabase) { }

  async findAll(): Promise<Episode[]> {
    const rows = await this.db
      .select()
      .from(episodes)
      .orderBy(asc(episodes.serieId), asc(episodes.episodeNumber));

    return rows.map(toEpisode);
  }

  async findById(id: number): Promise<Episode | null> {
    const [row] = await this.db
      .select()
      .from(episodes)
      .where(eq(episodes.id, id));

    return row ? toEpisode(row) : null;
  }

  async findBySerieId(serieId: number): Promise<Episode[]> {
    const rows = await this.db
      .select()
      .from(episodes)
      .where(eq(episodes.serieId, serieId))
      .orderBy(asc(episodes.episodeNumber));

    return rows.map(toEpisode);
  }

  async save(episode: Episode): Promise<Episode> {
    const [row] = await this.db
      .insert(episodes)
      .values({
        id: episode.id || undefined,
        serieId: episode.serieId,
        episodeNumber: episode.episodeNumber,
        airedAt: episode.airedAt,
      })
      .onConflictDoUpdate({
        target: episodes.id,
        set: {
          serieId: episode.serieId,
          episodeNumber: episode.episodeNumber,
          airedAt: episode.airedAt ? new Date(episode.airedAt) : null,
        },
      })
      .returning();

    return toEpisode(row);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(episodes).where(eq(episodes.id, id));
  }
}
