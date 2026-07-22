// src/services/tests/episode.service.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EpisodeService } from '../episodes/service.js';
import {
  EpisodeLinkUnavailableError,
  EpisodeNotFoundError,
} from '../episodes/error.js';
import type { DebridProvider } from '../debrid/debrid.service.js';
import type { Episode } from '../../models/episode.js';
import type { SubscriptionEpisode } from '../../models/subscription_episode.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';
import type { SubscriptionEpisodeRepository } from '../../repositories/subscription_episode.repository.js';

function buildEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 1,
    serieId: 1,
    episodeNumber: 1,
    airedAt: null,
    ...overrides,
  };
}

function buildSubscriptionEpisode(
  overrides: Partial<SubscriptionEpisode> = {},
): SubscriptionEpisode {
  return {
    subscriptionId: 1,
    episodeId: 1,
    status: 'pending',
    grabbedAt: null,
    ...overrides,
  };
}

describe('EpisodeService', () => {
  let episodeRepository: EpisodeRepository;
  let subscriptionEpisodeRepository: SubscriptionEpisodeRepository;
  let debridProvider: DebridProvider;
  let service: EpisodeService;

  beforeEach(() => {
    episodeRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findBySerieId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    subscriptionEpisodeRepository = {
      findBySubscriptionId: vi.fn(),
      findByStatus: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    };

    debridProvider = {
      getDirectDownloadLink: vi.fn(),
    };

    const subscriptionRepository = {
      findById: async () => ({
        id: 1,
        seriesId: 1,
        preferredFansub: [],
        preferredResolution: '1080p',
        minSeeders: 1,
        active: true,
        createdAt: new Date().toISOString(),
      }),
      findAll: async () => [],
      save: async (s: any) => s,
      delete: async () => { },
    };

    const serieRepository = {
      findById: async () => ({
        id: 1,
        anilistId: 123,
        canonicalTitle: 'Frieren',
      }),
      findByAnilistId: async () => null,
      findAll: async () => [],
      save: async (s: any) => s,
      saveTags: async () => { },
      findTagsBySerieId: async () => [],
      delete: async () => { },
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

    service = new EpisodeService(
      episodeRepository,                // 1
      subscriptionEpisodeRepository,    // 2
      subscriptionRepository,           // 3 ← AJOUTÉ
      serieRepository,                  // 4 ← AJOUTÉ
      torrentIndexer,                   // 5 ← AJOUTÉ
      debridProvider,                   // 6
    );
  });

  it('returns null for an unknown episode', async () => {
    vi.mocked(episodeRepository.findById).mockResolvedValue(null);

    await expect(service.getDetails(999)).resolves.toBeNull();
  });

  it('throws EpisodeNotFoundError when the subscription entry is absent', async () => {
    vi.mocked(debridProvider.getDirectDownloadLink).mockResolvedValue([
      { path: 'ep1.mkv', size: 100, link: 'http://x' },
    ]);
    vi.mocked(subscriptionEpisodeRepository.findBySubscriptionId)
      .mockResolvedValue([]);

    await expect(
      service.resolveDownloadLink(1, 999, 'magnet:xxx'),
    ).rejects.toThrow(EpisodeNotFoundError);
  });

  it('marks the subscription episode as found when debrid returns files', async () => {
    const entry = buildSubscriptionEpisode();

    vi.mocked(debridProvider.getDirectDownloadLink).mockResolvedValue([
      { path: 'ep1.mkv', size: 100, link: 'http://x' },
    ]);
    vi.mocked(subscriptionEpisodeRepository.findBySubscriptionId)
      .mockResolvedValue([entry]);
    vi.mocked(subscriptionEpisodeRepository.upsert)
      .mockImplementation(async (value) => value);

    const result = await service.resolveDownloadLink(1, 1, 'magnet:xxx');

    expect(result).toEqual(
      expect.objectContaining({
        subscriptionId: 1,
        episodeId: 1,
        status: 'found',
        grabbedAt: expect.any(String),
      }),
    );
  });

  it('marks the subscription episode as failed when debrid returns no files', async () => {
    const entry = buildSubscriptionEpisode();

    vi.mocked(debridProvider.getDirectDownloadLink).mockResolvedValue([]);
    vi.mocked(subscriptionEpisodeRepository.findBySubscriptionId)
      .mockResolvedValue([entry]);
    vi.mocked(subscriptionEpisodeRepository.upsert)
      .mockImplementation(async (value) => value);

    await expect(
      service.resolveDownloadLink(1, 1, 'magnet:xxx'),
    ).rejects.toThrow(EpisodeLinkUnavailableError);

    expect(subscriptionEpisodeRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionId: 1,
        episodeId: 1,
        status: 'failed',
        grabbedAt: null,
      }),
    );
  });

  it('lists all episodes', async () => {
    const episodes = [buildEpisode()];
    vi.mocked(episodeRepository.findAll).mockResolvedValue(episodes);

    await expect(service.list()).resolves.toEqual(episodes);
  });

  it('lists found subscription episodes', async () => {
    const entries = [buildSubscriptionEpisode({ status: 'found' })];
    vi.mocked(subscriptionEpisodeRepository.findByStatus)
      .mockResolvedValue(entries);

    await expect(service.listAvailableFiles()).resolves.toEqual(entries);
    expect(subscriptionEpisodeRepository.findByStatus).toHaveBeenCalledWith('found');
  });
});
