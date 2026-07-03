// main.ts
// --- composition root : seul fichier autorisé à connaître les classes concrètes ---

import { createApp } from './app.js';

import { InMemorySubscriptionRepository } from './repositories/in_memory/subscription.repository.js';
import { InMemorySerieRepository } from './repositories/in_memory/serie.repository.js';
import { AnilistService } from './services/anilist.service.js';
import { SubscriptionService } from './services/subscription.service.js';


import { InMemoryEpisodeRepository } from './repositories/in_memory/episode.repository.js';
import { PremiumizeService } from './services/premiumize.service.js';
import { EpisodeService } from './services/episode.service.js';
import { EpisodeController } from './controllers/episode.controller.js';
import { SubscriptionController } from './controllers/subscription.controller.js';

// domaine subscription
const subscriptionRepository = new InMemorySubscriptionRepository();
const seriesRepository = new InMemorySerieRepository();
const anilistService = new AnilistService();
const subscriptionService = new SubscriptionService(subscriptionRepository, seriesRepository, anilistService);
const subscriptionController = new SubscriptionController(subscriptionService);

// domaine episode
const premiumizeApiKey = process.env.PREMIUMIZE_API_KEY;
if (!premiumizeApiKey) {
  throw new Error("PREMIUMIZE_API_KEY manquant dans l'environnement");
}

const premiumizeService = new PremiumizeService({ apiKey: premiumizeApiKey });
const episodeRepository = new InMemoryEpisodeRepository();
const episodeService = new EpisodeService(episodeRepository, premiumizeService);
const episodeController = new EpisodeController(episodeService);

// --- fin composition root ---

const app = createApp({ subscriptionController, episodeController });
app.listen(process.env.PORT ?? 3000);
