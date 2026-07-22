export type Subscription = {
  id: number;
  seriesId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
  active: boolean;
  createdAt: string;
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
  coverImage?: string;
  episodeCount?: number | null;
  status?: string;
  format?: string;
  genres?: string[];
};

// ── AJOUTÉ : pagination ──
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

export type EpisodeStatus = 'pending' | 'searching' | 'found' | 'added' | 'ready' | 'failed';

export type Episode = {
  id: number;
  serieId: number;
  episodeNumber: number;
  airedAt: string | null;
};

export type SubscriptionEpisode = {
  subscriptionId: number;
  episodeId: number;
  status: EpisodeStatus;
  grabbedAt: string | null;
};
