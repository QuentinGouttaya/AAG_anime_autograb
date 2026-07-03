// src/tests/app.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../app.js';
import type { AppDependencies } from '../dependencies/app_dependencies.js';
import { InMemoryEpisodeRepository } from '../repositories/in_memory/episode.repository.js';
import { InMemorySubscriptionRepository } from '../repositories/in_memory/subscription.repository.js';
import { InMemorySerieRepository } from '../repositories/in_memory/serie.repository.js';
import { EpisodeService } from '../services/episode.service.js';
import { PremiumizeService } from '../services/premiumize.service.js';
import { AnilistService } from '../services/anilist.service.js';
import { SubscriptionService } from '../services/subscription.service.js';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import { EpisodeController } from '../controllers/episode.controller.js';

describe('App integration', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const episodeRepository = new InMemoryEpisodeRepository();
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const serieRepository = new InMemorySerieRepository();

    const premiumizeConfig = {
      apiKey: process.env.PREMIUMIZE_API_KEY ?? '',
      baseUrl: process.env.PREMIUMIZE_BASE_URL,
    };
    const premiumizeService = new PremiumizeService(premiumizeConfig);
    const anilistService = new AnilistService();

    const episodeService = new EpisodeService(episodeRepository, premiumizeService);
    const subscriptionService = new SubscriptionService(
      subscriptionRepository,
      serieRepository,
      anilistService,
    );

    const episodeController = new EpisodeController(episodeService);
    const subscriptionController = new SubscriptionController(subscriptionService);

    const dependencies: AppDependencies = {
      episodeController,
      subscriptionController,
    };

    const app = createApp(dependencies);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  it('GET /episodes returns a list', async () => {
    const res = await fetch(`${baseUrl}/api/episodes`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /episodes/:id returns 404 for unknown episode', async () => {
    const res = await fetch(`${baseUrl}/api/episodes/999999`);
    expect(res.status).toBe(404);
  });
});
