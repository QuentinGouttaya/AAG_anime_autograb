import type { Serie } from '@aag/domain';

export interface SerieRepository {
  findById(id: number): Promise<Serie | null>;
  findByAnilistId(anilistId: number): Promise<Serie | null>;
  save(serie: Serie): Promise<void>;
}
