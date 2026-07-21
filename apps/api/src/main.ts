import 'dotenv/config';

import { createApp } from './app.js';

import { EpisodeController } from './controllers/episode.controller.js';
import { SubscriptionController } from './controllers/subscription.controller.js';

import { InMemoryEpisodeRepository } from './repositories/in_memory/episode.repository.js';
import { InMemorySerieRepository } from './repositories/in_memory/serie.repository.js';
import { InMemorySubscriptionEpisodeRepository } from './repositories/in_memory/subscription_episode.repository.js';
import { InMemorySubscriptionRepository } from './repositories/in_memory/subscription.repository.js';

import type { DebridProvider } from './services/debrid/debrid.service.js';
import { PremiumizeService } from './services/debrid/premiumize/service.js';
import { EpisodeService } from './services/episodes/service.js';

import { AnilistService } from './services/metadata/anilist/service.js';
import type { MetadataService } from './services/metadata/metadata.service.js';

import { SubscriptionService } from './services/subscription/subscription.service.js';

const port = Number(process.env.PORT ?? 3000);
const premiumizeApiKey = process.env.PREMIUMIZE_API_KEY;

if (!premiumizeApiKey) {
  throw new Error('PREMIUMIZE_API_KEY is required');
}

const episodeRepository = new InMemoryEpisodeRepository();
const serieRepository = new InMemorySerieRepository();
const subscriptionRepository = new InMemorySubscriptionRepository();
const subscriptionEpisodeRepository =
  new InMemorySubscriptionEpisodeRepository();

const metadataProvider: MetadataService = new AnilistService();

const debridProvider: DebridProvider = new PremiumizeService({
  apiKey: premiumizeApiKey,
});

const subscriptionService = new SubscriptionService(
  subscriptionRepository,
  serieRepository,
  metadataProvider,
);

const episodeService = new EpisodeService(
  episodeRepository,
  subscriptionEpisodeRepository,
  debridProvider,
);

const subscriptionController =
  new SubscriptionController(subscriptionService);

const episodeController = new EpisodeController(episodeService);

const app = createApp({
  subscriptionController,
  episodeController,
});

app.listen(port, () => {
  console.info(`AAG API listening on port ${port}`);
});
