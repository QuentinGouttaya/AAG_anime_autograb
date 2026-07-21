import type { SubscriptionController } from '../controllers/subscription.controller.js';
import type { EpisodeController } from '../controllers/episode.controller.js';
import type { MetadataController } from '../controllers/metadata.controller.js';

export interface AppDependencies {
  subscriptionController: SubscriptionController;
  episodeController: EpisodeController;
  metadataController: MetadataController;
}
