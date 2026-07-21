import type { Episode } from '../models/episode.js';

export interface EpisodeRepository {
  findAll(): Promise<Episode[]>;
  findById(id: number): Promise<Episode | null>;
  findBySerieId(serieId: number): Promise<Episode[]>;
  save(episode: Episode): Promise<Episode>;
  delete(id: number): Promise<void>;
}
