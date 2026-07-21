import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Serie } from '../../../models/serie.js';
import type { Tag } from '../../../models/tag.js';
import type { SerieRepository } from '../../serie.repository.js';
import { series, tags, serieTags } from './schema.js';
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

  async save(serie: Serie): Promise<Serie> {
    if (serie.id === 0) {
      const [row] = await this.db
        .insert(series)
        .values({ anilistId: serie.anilistId, canonicalTitle: serie.canonicalTitle })
        .returning();
      return toSerie(row);
    }
    const [row] = await this.db
      .update(series)
      .set({ anilistId: serie.anilistId, canonicalTitle: serie.canonicalTitle })
      .where(eq(series.id, serie.id))
      .returning();
    return toSerie(row);
  }

  async saveTags(serieId: number, serieTagsList: Tag[]): Promise<void> {
    if (serieTagsList.length === 0) return;

    // 1. Upsert les tags (dédupliqués par anilistId)
    const insertedTags = await this.db
      .insert(tags)
      .values(serieTagsList.map((t) => ({ anilistId: t.id, name: t.name, isAdult: t.isAdult })))
      .onConflictDoUpdate({
        target: tags.anilistId,
        set: { name: tags.name, isAdult: tags.isAdult },
      })
      .returning();

    // 2. Remplace les liens serie_tags pour cette série
    await this.db.delete(serieTags).where(eq(serieTags.serieId, serieId));
    await this.db.insert(serieTags).values(
      insertedTags.map((t) => ({ serieId, tagId: t.id }))
    );
  }

  async findTagsBySerieId(serieId: number): Promise<Tag[]> {
    const rows = await this.db
      .select({ id: tags.anilistId, name: tags.name, isAdult: tags.isAdult })
      .from(serieTags)
      .innerJoin(tags, eq(serieTags.tagId, tags.id))
      .where(eq(serieTags.serieId, serieId));
    return rows;
  }
}
