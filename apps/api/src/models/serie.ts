import type { Episode } from './episode.js';
import type { Tag } from './tag.js';

export type Serie = {
  id: number;
  anilistId: number;
  canonicalTitle: string;
  romajiTitle?: string;
  coverImage?: string;
  episodeCount?: number | null;   // ← RENOMMÉ (était "episodes")
  status?: string;
  format?: string;
  genres?: string[];
};

// Pas de conflit : episodes ici est bien Episode[]
export type SerieWithEpisodes = Serie & { episodes: Episode[] };
export type SerieWithTags = Serie & { tags: Tag[] };
