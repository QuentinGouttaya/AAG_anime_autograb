// src/models/subscription_episode.ts
import type { TrackedEpisode } from './tracked_episode.js';
import type { Subscription } from './subscription.js';

export type EpisodeStatus =
  | 'pending'
  | 'searching'
  | 'found'
  | 'added'
  | 'ready'
  | 'failed';

export type SubscriptionEpisode = {
  subscriptionId: number;
  episodeId: number;
  status: EpisodeStatus;
  grabbedAt: string | null;
};

export type SubscriptionWithEpisodes = Subscription & {
  episodeLinks: TrackedEpisode[];
};
