import type { Episode } from "./episode";
export type Series = {
  id: number;
  anilistId: number;
  canonicalTitle: string;
};

export type SeriesWithEpisodes = Series & { episodes: Episode[] };
