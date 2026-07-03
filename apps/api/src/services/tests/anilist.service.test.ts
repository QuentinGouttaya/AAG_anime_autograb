// src/services/tests/anilist.service.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnilistService, AnilistApiError } from '../anilist.service.js';

describe('AnilistService', () => {
  let service: AnilistService;

  beforeEach(() => {
    service = new AnilistService();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('searchAnime returns media list on success', async () => {
    const media = [
      { id: 1, title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: '進撃の巨人' }, episodes: 25, status: 'FINISHED' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      json: async () => ({ data: { Page: { media } } }),
    } as Response);

    const result = await service.searchAnime('Attack on Titan');
    expect(result).toEqual(media);
  });

  it('throws AnilistApiError on 429 with Too Many Requests message', async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 429,
      json: async () => ({ data: null, errors: [{ message: 'Too Many Requests.', status: 429 }] }),
    } as Response);

    await expect(service.searchAnime('x')).rejects.toThrow(AnilistApiError);
  });

  it('getAnimeById returns null when Media is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      json: async () => ({ data: { Media: null } }),
    } as Response);

    const result = await service.getAnimeById(999999);
    expect(result).toBeNull();
  });

  it('propagates GraphQL error message on malformed query', async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      json: async () => ({ data: null, errors: [{ message: 'Validation failed' }] }),
    } as Response);

    await expect(service.searchAnime('x')).rejects.toThrow('Validation failed');
  });
});
