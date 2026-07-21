import type { Serie } from '../../models/serie.js';
import type { Episode } from '../../models/episode.js';

export interface MetadataService {
  searchAnime(title: string): Promise<Serie[]>;
  getAnimeById(id: number): Promise<(Serie & { episodes: Episode[] }) | null>;
  getSeasonAnime(season: Season, year: number): Promise<Serie[]>;
}
