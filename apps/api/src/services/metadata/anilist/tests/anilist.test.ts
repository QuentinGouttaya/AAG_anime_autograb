// src/infrastructure/metadata/anilist/anilist.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnilistService } from '../service.js';

describe('AnilistService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps GraphQL response to Serie and Episodes', async () => {
    const mockJson = {
      data: {
        Media: {
          id: 1,
          title: { english: 'Cowboy Bebop', romaji: 'Cowboy Bebop', native: 'カウボーイビバップ' },
          episodes: 26,
          airingSchedule: {
            nodes: [
              { episode: 1, airingAt: 1600000000 },
              { episode: 2, airingAt: 1600604800 },
            ],
          },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockJson),
    });

    const service = new AnilistService();
    const result = await service.getAnimeById(1);

    expect(result?.canonicalTitle).toBe('Cowboy Bebop');
    expect(result?.episodes).toHaveLength(2);
    expect(result?.episodes[0].episodeNumber).toBe(1);
    expect(result?.episodes[0].airedAt).toEqual(new Date(1600000000 * 1000));
  });
});
