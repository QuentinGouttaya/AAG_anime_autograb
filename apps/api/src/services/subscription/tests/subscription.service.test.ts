// services/subscription/tests/subscription.service.test.ts
import { describe, it, expect } from 'vitest';
import { SubscriptionService } from '../subscription.service.js';
import { InMemorySubscriptionRepository } from '../../../repositories/in_memory/subscription.repository.js';
import { InMemorySerieRepository } from '../../../repositories/in_memory/serie.repository.js';
import { InMemoryEpisodeRepository } from "../../../repositories/in_memory/episode.repository.js";
import type { MetadataService } from '../../metadata/metadata.service.js';

describe('SubscriptionService.create', () => {
  it('persists tags fetched from metadata when subscribing to a new serie', async () => {
    const serieRepository = new InMemorySerieRepository();
    const subscriptionRepository = new InMemorySubscriptionRepository();
    const episodeRepository = new InMemoryEpisodeRepository();

    const fakeTags = [
      { id: 1, name: 'Isekai', isAdult: false },
      { id: 2, name: 'Comedy', isAdult: false },
    ];

    const metadataService: MetadataService = {
      searchAnime: async () => ({
        data: [],
        pageInfo: {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          hasNextPage: false,
          perPage: 20,
        },
      }),
      getSeasonAnime: async () => [],
      getSeasonMetadata: async () => [],
      getAnimeById: async (id: number) => ({
        id: 0,
        anilistId: id,
        canonicalTitle: 'Test Anime',
        episodes: [],
        tags: fakeTags,
      }),
    };

    const service = new SubscriptionService(subscriptionRepository, serieRepository, metadataService, episodeRepository);

    await service.create({
      anilistId: 154587,
      preferredFansub: ['SubsPlease'],
      preferredResolution: '1080p',
      minSeeders: 1,
    });

    const serie = await serieRepository.findByAnilistId(154587);
    expect(serie).not.toBeNull();

    const storedTags = await serieRepository.findTagsBySerieId(serie!.id);
    expect(storedTags).toEqual(fakeTags);
  });
});
