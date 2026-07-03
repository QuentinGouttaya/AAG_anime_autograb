import type { EpisodeStatus } from '../../../models/subscription_episode.js';

export type { EpisodeStatus };

export interface SubscriptionEpisode {
  subscriptionId: number;
  episodeId: number;
  status: EpisodeStatus;
  grabbedAt: string | null;
}

export interface SubscriptionEpisodeRepository {
  findBySubscriptionId(subscriptionId: number): Promise<SubscriptionEpisode[]>;
  findByStatus(status: EpisodeStatus): Promise<SubscriptionEpisode[]>;
  upsert(entry: SubscriptionEpisode): Promise<SubscriptionEpisode>;
}
