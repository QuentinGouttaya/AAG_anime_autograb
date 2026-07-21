import 'dotenv/config';

import { createApp } from './app.js';

import { EpisodeController } from './controllers/episode.controller.js';
import { SubscriptionController } from './controllers/subscription.controller.js';

import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

import { db } from './repositories/storage/index.js';
import { PostgresEpisodeRepository } from './repositories/storage/db/episode.repository.js';
import { PostgresSerieRepository } from './repositories/storage/db/serie.repository.js';
import { PostgresSubscriptionRepository } from './repositories/storage/db/subscription.repository.js';
import { PostgresSubscriptionEpisodeRepository } from './repositories/storage/db/subscription_episode.repository.js';

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

const episodeRepository = new PostgresEpisodeRepository(db);
const serieRepository = new PostgresSerieRepository(db);
const subscriptionRepository = new PostgresSubscriptionRepository(db);
const subscriptionEpisodeRepository =
  new PostgresSubscriptionEpisodeRepository(db);

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
