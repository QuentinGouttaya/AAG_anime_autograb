import 'dotenv/config';
import { createApp } from './app.js';
import { EpisodeController } from './controllers/episode.controller.js';
import { SubscriptionController } from './controllers/subscription.controller.js';
import { MetadataController } from './controllers/metadata.controller.js';
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

// ── AJOUTÉ : TorrentIndexer ──
import { NyaaIndexer } from './services/torrents/nyaa/service.js';
import type { TorrentIndexer } from './services/torrents/torrent.service.js';

const port = Number(process.env.PORT ?? 3000);
const premiumizeApiKey = process.env.PREMIUMIZE_API_KEY;

if (!premiumizeApiKey) {
  throw new Error('PREMIUMIZE_API_KEY is required');
}

const episodeRepository = new PostgresEpisodeRepository(db);
const serieRepository = new PostgresSerieRepository(db);
const subscriptionRepository = new PostgresSubscriptionRepository(db);
const subscriptionEpisodeRepository = new PostgresSubscriptionEpisodeRepository(db);

const metadataProvider: MetadataService = new AnilistService();

const debridProvider: DebridProvider = new PremiumizeService({
  apiKey: premiumizeApiKey,
});

// ── AJOUTÉ : NyaaIndexer ──
const torrentIndexer: TorrentIndexer = new NyaaIndexer({
  baseUrl: 'https://nyaa.si',
  category: '1_2',    // Anime - English-translated
  filter: '2',        // No remakes
});

const subscriptionService = new SubscriptionService(
  subscriptionRepository,
  serieRepository,
  metadataProvider,
  episodeRepository,
);

// ── MODIFIÉ : 6 arguments ──
const episodeService = new EpisodeService(
  episodeRepository,                    // 1
  subscriptionEpisodeRepository,        // 2
  subscriptionRepository,               // 3 ← AJOUTÉ
  serieRepository,                      // 4 ← AJOUTÉ
  torrentIndexer,                       // 5 ← AJOUTÉ
  debridProvider,                       // 6
);

const subscriptionController = new SubscriptionController(subscriptionService);
const episodeController = new EpisodeController(episodeService);
const metadataController = new MetadataController(metadataProvider);

const app = createApp({
  subscriptionController,
  episodeController,
  metadataController,
});

app.listen(port, () => {
  console.info(`AAG API listening on port ${port}`);
});
