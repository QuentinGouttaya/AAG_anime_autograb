import type { Episode } from "./episode.js";
import type { Tag } from "./tag.js";
export type Serie = {
  id: number;
  anilistId: number;
  canonicalTitle: string;
};


//Volontaire car je veux de la composition dans ma bdd à terme
export type SerieWithEpisodes = Serie & { episodes: Episode[] };
export type SerieWithTags = Serie & { tags: Tag[] };
