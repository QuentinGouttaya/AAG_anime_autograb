import type { Serie } from '../models/serie.js';
import type { Tag } from '../models/tag.js';

export interface SerieRepository {
  findById(id: number): Promise<Serie | null>;
  findByAnilistId(anilistId: number): Promise<Serie | null>;
  save(serie: Serie): Promise<Serie>;
  delete(id: number): Promise<void>;
  saveTags(serieId: number, tags: Tag[]): Promise<void>;
  findTagsBySerieId(serieId: number): Promise<Tag[]>;
}
