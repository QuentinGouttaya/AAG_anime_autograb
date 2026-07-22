// src/tests/app.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from '../app.js';
import type { AppDependencies } from '../dependencies/app_dependencies.js';
import { InMemoryEpisodeRepository } from '../repositories/in_memory/episode.repository.js';
import { InMemorySubscriptionRepository } from '../repositories/in_memory/subscription.repository.js';
import { InMemorySubscriptionEpisodeRepository } from '../repositories/in_memory/subscription_episode.repository.js';
import { InMemorySerieRepository } from '../repositories/in_memory/serie.repository.js';
import { EpisodeService } from '../services/episodes/service.js';
import type { DebridProvider } from '../services/debrid/debrid.service.js';
import { AnilistService } from '../services/metadata/anilist/service.js';
import { SubscriptionService } from '../services/subscription/subscription.service.js';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import { EpisodeController } from '../controllers/episode.controller.js';
import { MetadataController } from '../controllers/metadata.controller.js';


describe('App integration', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const episodeRepository = new InMemoryEpisodeRepository();
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const subscriptionEpisodeRepository =
      new InMemorySubscriptionEpisodeRepository();
    const serieRepository = new InMemorySerieRepository();

    const debridProvider: DebridProvider = {
      getDirectDownloadLink: async () => [],
    };
    const torrentIndexer = {
      search: async () => [
        {
          title: '[SubsPlease] Frieren - 12 (1080p) [ABC123].mkv',
          magnet: 'magnet:?xt=urn:btih:abc123&dn=test',
          size: '1.4 GiB',
          seeders: 176,
          leechers: 11,
          publishedAt: new Date(),
        },
      ],
    };

    const anilistService = new AnilistService();

    const episodeService = new EpisodeService(
      episodeRepository,
      subscriptionEpisodeRepository,
      subscriptionRepository,
      serieRepository,
      torrentIndexer,       // ← maintenant défini
      debridProvider,
    );

    const subscriptionService = new SubscriptionService(
      subscriptionRepository,
      serieRepository,
      anilistService,
    );

    const episodeController = new EpisodeController(episodeService);
    const subscriptionController = new SubscriptionController(
      subscriptionService,
    );


    const metadataController = new MetadataController(new AnilistService());

    const dependencies: AppDependencies = {
      episodeController,
      subscriptionController,
      metadataController,           // ← AJOUTÉ
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

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('GET /episodes returns a list', async () => {
    const res = await fetch(`${baseUrl}/api/episodes`);

    expect(res.status).toBe(200);
    expect(Array.isArray(await res.json())).toBe(true);
  });

  it('GET /episodes/:id returns 404 for an unknown episode', async () => {
    const res = await fetch(`${baseUrl}/api/episodes/999999`);

    expect(res.status).toBe(404);
  });
});
