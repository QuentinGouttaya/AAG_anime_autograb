import type { Episode } from "./episode.js";
export type Serie = {
  id: number;
  anilistId: number;
  canonicalTitle: string;
};

export type SerieWithEpisodes = Serie & { episodes: Episode[] };
