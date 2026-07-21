import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Serie } from '../../../models/serie.js';
import type { SerieRepository } from '../../serie.repository.js';
import { series, tags, serieTags } from './schema.js';
import { BaseRepository } from '../base.repository.js';
import { Tag } from "../../../models/tag.js";

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

  async saveTags(serieId: number, tagsToSave: Tag[]): Promise<void> {
    if (tagsToSave.length === 0) return;

    await this.db
      .insert(tags)
      .values(
        tagsToSave.map((tag) => ({
          id: tag.id,
          anilistId: tag.id, // À remplacer si ton modèle expose un vrai anilistId
          name: tag.name,
          isAdult: tag.isAdult,
        })),
      )
      .onConflictDoNothing();

    await this.db
      .insert(serieTags)
      .values(tagsToSave.map((tag) => ({ serieId, tagId: tag.id })))
      .onConflictDoNothing();
  }

  async findTagsBySerieId(serieId: number): Promise<Tag[]> {
    return this.db
      .select({
        id: tags.id,
        name: tags.name,
        isAdult: tags.isAdult,
      })
      .from(serieTags)
      .innerJoin(tags, eq(serieTags.tagId, tags.id))
      .where(eq(serieTags.serieId, serieId));
  }
}
