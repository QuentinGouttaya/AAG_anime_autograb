// src/services/tests/anilist.service.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnilistService } from '../service.js';
import type { MetadataService } from '../../metadata.service.js';

describe('AnilistService', () => {
  let service: MetadataService;

  beforeEach(() => {
    service = new AnilistService();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('searchAnime maps AniList media to Serie[]', async () => {
    const media = [
      {
        id: 1,
        title: { romaji: 'Shingeki no Kyojin', english: 'Attack on Titan', native: '進撃の巨人' },
        episodes: 25,
        airingSchedule: { nodes: [] },
      },
    ];

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { Page: { media } } }),
    } as Response);

    const result = await service.searchAnime('Attack on Titan');
    expect(result).toEqual([{ id: 0, anilistId: 1, canonicalTitle: 'Attack on Titan' }]);
  });

  it('throws retryable AnilistApiError on 429', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response);

    await expect(service.searchAnime('x')).rejects.toMatchObject({ retryable: true });
  });

  it('throws non-retryable AnilistApiError on 4xx', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    } as Response);

    await expect(service.searchAnime('x')).rejects.toMatchObject({ retryable: false });
  });

  it('getAnimeById returns null when Media is null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { Media: null } }),
    } as Response);

    const result = await service.getAnimeById(999999);
    expect(result).toBeNull();
  });

  it('getAnimeById maps airingSchedule into Episode[]', async () => {
    const airingAt = 1735689600;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          Media: {
            id: 42,
            title: { romaji: 'Test Anime', english: 'Test Anime EN', native: 'テスト' },
            episodes: 12,
            airingSchedule: { nodes: [{ episode: 1, airingAt }] },
          },
        },
      }),
    } as Response);

    const result = await service.getAnimeById(42);
    expect(result).toEqual({
      id: 0,
      anilistId: 42,
      canonicalTitle: 'Test Anime EN',
      episodes: [
        {
          id: 0,
          serieId: 0,
          subscriptionId: 0,
          episodeNumber: 1,
          status: 'pending',
          airedAt: new Date(airingAt * 1000),
        },
      ],
    });
  });

  it('propagates GraphQL error message on malformed query', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: null, errors: [{ message: 'Validation failed' }] }),
    } as Response);

    await expect(service.searchAnime('x')).rejects.toThrow('Validation failed');
  });
});

