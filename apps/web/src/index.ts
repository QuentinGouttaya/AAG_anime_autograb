export type Genre = {
  id: number;
  name: string;
};

export type Tag = {
  id: number;
  name: string;
  isAdult?: boolean;
};

export type Anime = {
  id: number;
  title: string;
  synopsis?: string | null;
  posterImage?: string | null;
  bannerImage?: string | null;
  isAdult: boolean;
  episodesCount?: number | null;
  genres: Genre[];
  tags: Tag[];
};

export type Subscription = {
  id: number;
  animeId: number;
  createdAt: string;
  anime?: Anime;
};
