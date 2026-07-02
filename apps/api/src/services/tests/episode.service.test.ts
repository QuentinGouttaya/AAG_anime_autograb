// src/services/tests/episode.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EpisodeService, EpisodeNotFoundError } from '../episode.service.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';
import type { PremiumizeService } from '../premiumize.service.js';
import type { Episode } from '@aag/domain';

function buildEpisode(overrides: Partial<Episode> = {}): Episode {
  return { id: 1, subscriptionId: 1, episodeNumber: 1, status: 'pending', ...overrides };
}

describe('EpisodeService', () => {
  let episodeRepository: EpisodeRepository;
  let premiumizeService: PremiumizeService;
  let service: EpisodeService;

  beforeEach(() => {
    episodeRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findBySubscriptionId: vi.fn(),
      findByStatus: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    premiumizeService = {
      getDirectDownloadLink: vi.fn(),
    } as unknown as PremiumizeService;

    service = new EpisodeService(episodeRepository, premiumizeService);
  });

  it('throws EpisodeNotFoundError when episode does not exist', async () => {
    vi.mocked(episodeRepository.findById).mockResolvedValue(null);

    await expect(service.getDetails(999)).resolves.toBeNull();
    await expect(service.resolveDownloadLink(999, 'magnet:xxx')).rejects.toThrow(EpisodeNotFoundError);
  });

  it('marks episode as found when Premiumize returns files', async () => {
    const episode = buildEpisode();
    vi.mocked(episodeRepository.findById).mockResolvedValue(episode);
    vi.mocked(premiumizeService.getDirectDownloadLink).mockResolvedValue([
      { path: 'ep1.mkv', size: 100, link: 'http://x' },
    ]);
    vi.mocked(episodeRepository.save).mockImplementation(async (e) => e);

    const result = await service.resolveDownloadLink(1, 'magnet:xxx');

    expect(result.status).toBe('found');
  });

  it('marks episode as failed when no files found', async () => {
    const episode = buildEpisode();
    vi.mocked(episodeRepository.findById).mockResolvedValue(episode);
    vi.mocked(premiumizeService.getDirectDownloadLink).mockResolvedValue([]);
    vi.mocked(episodeRepository.save).mockImplementation(async (e) => e);

    await expect(service.resolveDownloadLink(1, 'magnet:xxx')).rejects.toThrow();

    expect(episodeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('lists all episodes', async () => {
    const episodes = [buildEpisode()];
    vi.mocked(episodeRepository.findAll).mockResolvedValue(episodes);

    const result = await service.list();
    expect(result).toEqual(episodes);
  });
});
