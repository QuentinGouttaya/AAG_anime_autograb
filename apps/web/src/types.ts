// Garde tes types existants mais assure-toi qu'ils sont cohérents

export type Genre = {
  id: number;
  name: string;
};

export type Tag = {
  id: number;
  name: string;
  isAdult?: boolean;
};

// Note: Tu as "Anime" ici mais "Serie" ailleurs. Je recommande de garder "Serie" partout pour la cohérence
export type Serie = {
  id: number;
  anilistId: number;
  canonicalTitle: string;
  romajiTitle?: string;
  coverImage?: string;
  bannerImage?: string;
  description?: string;
  episodeCount?: number | null;
  episodes?: number | null;
  status?: string;
  format?: string;
  genres?: string[];
  tags?: { id: number; anilistId: number; name: string; isAdult?: boolean }[];
};

export type Subscription = {
  id: number;
  seriesId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
  active: boolean;
  createdAt: string;
  episodeCount?: number;
};

export type SubscriptionWithSerie = Subscription & {
  serie: Serie;
};

export type Episode = {
  id: number;
  serieId: number;
  episodeNumber: number;
  airedAt: string | null;
};

export type DetailedEpisode = Episode & {
  status?: EpisodeStatus;
  grabbedAt?: string | null;
  torrentTitle?: string;
  torrentSeeders?: number;
  torrentSize?: string;
  premiumizeItemId?: string;
};

export type EpisodeStatus = 'pending' | 'searching' | 'found' | 'added' | 'ready' | 'failed' | 'grabbed';

export type PageInfo = {
  currentPage: number;
  lastPage: number;
  total: number;
  hasNextPage: boolean;
  perPage: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pageInfo: PageInfo;
};

export type CreateSubscriptionInput = {
  anilistId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
};
