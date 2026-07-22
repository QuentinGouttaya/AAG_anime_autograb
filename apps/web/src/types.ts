export type Subscription = {
  id: number;
  seriesId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
  active: boolean;
  createdAt: string;
  episodeCount?: number; // Added for the Subscriptions table column
};

export type SubscriptionWithSerie = Subscription & {
  serie: Serie;
};

export type CreateSubscriptionInput = {
  anilistId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
};

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export type Serie = {
  id: number;
  anilistId: number;
  canonicalTitle: string;
  romajiTitle?: string; // Added for the Nyaa search fallback
  coverImage?: string;
  bannerImage?: string; // Useful for future detail modals
  description?: string; // Useful for future detail modals
  episodeCount?: number | null;
  episodes?: number | null;
  status?: string;
  format?: string;
  genres?: string[];
  tags?: { id: number; anilistId: number; name: string; isAdult?: boolean }[];
};

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

export type EpisodeStatus =
  | 'pending'
  | 'searching'
  | 'found'
  | 'added'
  | 'ready'
  | 'failed'
  | 'grabbed';

// Base Episode type (returned by generic endpoints)
export type Episode = {
  id: number;
  serieId: number;
  episodeNumber: number;
  airedAt: string | null;
};

// Extended type used in the EpisodePanel to show subscription-specific data
export type DetailedEpisode = Episode & {
  status?: EpisodeStatus;
  grabbedAt?: string | null;
  torrentTitle?: string;
  torrentSeeders?: number;
  torrentSize?: string;
};

export type SubscriptionEpisode = {
  subscriptionId: number;
  episodeId: number;
  status: EpisodeStatus;
  grabbedAt: string | null;
  torrentTitle?: string; // Added so the backend can return the grabbed torrent name
};
