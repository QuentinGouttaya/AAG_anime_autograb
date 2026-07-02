import type { SubscriptionController } from '../controllers/subscription.controller.js';
import type { EpisodeController } from '../controllers/episode.controller.js';

export interface AppDependencies {
  subscriptionController: SubscriptionController;
  episodeController: EpisodeController;
}
