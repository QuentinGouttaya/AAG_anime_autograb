export type Subscription = {
  id: number;
  seriesId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
  active: boolean;
  createdAt: string;
  episodeCount?: number; // AJOUTÉ - Propriété calculée par la requête SQL
};

export type SubscriptionSortKey = 'createdAt' | 'title' | 'episodeCount';
export const SUBSCRIPTION_SORT_KEYS: SubscriptionSortKey[] = [
  'createdAt',
  'title',
  'episodeCount',
];

export type SubscriptionStatus = 'active' | 'inactive';
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['active', 'inactive'];
