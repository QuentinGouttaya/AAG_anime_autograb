// src/services/tests/anilist.service.integration.test.ts
import { describe, it, expect } from 'vitest';
import { AnilistService } from '../../services/metadata/anilist/service.js';

describe('AnilistService (integration, real API)', () => {
  const service = new AnilistService();

  it('searchAnime returns real results from AniList for a known title', async () => {
    const result = await service.searchAnime('Frieren');
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty('anilistId');
    expect(result.data[0]).toHaveProperty('canonicalTitle');
  }, 15000);

  it('getAnimeById returns a real anime with episodes for a known AniList ID', async () => {
    // 16498 = Shingeki no Kyojin (Attack on Titan) sur AniList
    const result = await service.getAnimeById(16498);

    expect(result).not.toBeNull();
    expect(result?.anilistId).toBe(16498);
    expect(result?.canonicalTitle).toBeTruthy();
    expect(Array.isArray(result?.episodes)).toBe(true);
  }, 15000);

  it('getAnimeById returns null for a non-existent ID', async () => {
    const result = await service.getAnimeById(999999999);
    expect(result).toBeNull();
  }, 15000);
});
