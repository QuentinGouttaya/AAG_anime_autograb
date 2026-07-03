import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Serie } from '../../../models/serie.js';
import type { SerieRepository } from '../../serie.repository.js';
import { series } from './schema.js';
import { BaseRepository } from '../base.repository.js';

function toSerie(row: typeof series.$inferSelect): Serie {
  return { id: row.id, anilistId: row.anilistId, canonicalTitle: row.canonicalTitle };
}

export class PostgresSerieRepository extends BaseRepository<typeof series> implements SerieRepository {
  constructor(db: NodePgDatabase) {
    super(db, series, series.id);
  }

  async findById(id: number): Promise<Serie | null> {
    const row = await this.findRowById(id);
    return row ? toSerie(row) : null;
  }

  async findByAnilistId(anilistId: number): Promise<Serie | null> {
    const [row] = await this.findRowsWhere(eq(series.anilistId, anilistId));
    return row ? toSerie(row) : null;
  }

  async save(serie: Serie): Promise<void> {
    if (serie.id === 0) {
      await this.db.insert(series).values({ anilistId: serie.anilistId, canonicalTitle: serie.canonicalTitle });
      return;
    }
    await this.db
      .update(series)
      .set({ anilistId: serie.anilistId, canonicalTitle: serie.canonicalTitle })
      .where(eq(series.id, serie.id));
  }


}
