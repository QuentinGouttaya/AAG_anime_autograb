import type { Serie } from '../models/serie.js';

export interface SerieRepository {
  findById(id: number): Promise<Serie | null>;
  findByAnilistId(anilistId: number): Promise<Serie | null>;
  save(serie: Serie): Promise<void>;
}
