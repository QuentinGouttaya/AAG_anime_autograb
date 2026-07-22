import type { Serie } from '../../models/serie.js';
import type { Episode } from '../../models/episode.js';
import type { Tag } from '../../models/tag.js';
import type { Season } from '../../models/season.js';
import type { AnimeMetadata } from '../../models/anime_metadata.js';

// ── AJOUTÉ : types pagination ──
export interface PageInfo {
  currentPage: number;
  lastPage: number;
  total: number;
  hasNextPage: boolean;
  perPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pageInfo: PageInfo;
}

export interface MetadataService {
  searchAnime(
    title: string,
    page?: number,
    perPage?: number,
  ): Promise<PaginatedResult<Serie>>;

  getAnimeById(id: number): Promise<(Serie & { episodes: Episode[]; tags: Tag[] }) | null>;
  getSeasonAnime(season: Season, year: number): Promise<Serie[]>;
  getSeasonMetadata(season: Season, year: number): Promise<AnimeMetadata[]>;
}
