import type { Serie } from '../../models/serie.js';
import type { Episode } from '../../models/episode.js';
import type { Tag } from '../../models/tag.js';
import type { Season } from '../../models/season.js';
import type { AnimeMetadata } from '../../models/anime_metadata.js';


export interface MetadataService {
  searchAnime(title: string): Promise<Serie[]>;
  getAnimeById(id: number): Promise<(Serie & { episodes: Episode[]; tags: Tag[] }) | null>;
  getSeasonAnime(season: Season, year: number): Promise<Serie[]>;

  // Nouveau : pour la reco / filtre / scoring
  getSeasonMetadata(season: Season, year: number): Promise<AnimeMetadata[]>;
}
