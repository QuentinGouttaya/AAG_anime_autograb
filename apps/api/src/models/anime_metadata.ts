import { Episode } from "./episode.js";
import { Serie } from "./serie.js";
import { Tag } from "./tag.js";

export type AnimeMetadata = {
  serie: Serie;
  episodes: Episode[];
  tags: Tag[];
};
