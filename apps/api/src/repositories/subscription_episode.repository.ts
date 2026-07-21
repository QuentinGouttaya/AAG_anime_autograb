import type {
  EpisodeStatus,
  SubscriptionEpisode,
} from '../models/subscription_episode.js';

export interface SubscriptionEpisodeRepository {
  findBySubscriptionId(
    subscriptionId: number,
  ): Promise<SubscriptionEpisode[]>;

  findByStatus(
    status: EpisodeStatus,
  ): Promise<SubscriptionEpisode[]>;

  upsert(entry: SubscriptionEpisode): Promise<SubscriptionEpisode>;

  delete(
    subscriptionId: number,
    episodeId: number,
  ): Promise<void>;
}
