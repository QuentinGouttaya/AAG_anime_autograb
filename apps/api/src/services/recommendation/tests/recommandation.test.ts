// src/services/recommendation/tests/recommendation.test.ts
import { describe, it, expect } from 'vitest';
import { RecommendationService } from '../service.js';
import { toVector } from '../vectorize.js';
import type { AnimeMetadata } from '../../filter/metadata/filter.js';

const CATALOG: AnimeMetadata[] = [
  {
    anilistId: 1, isAdult: false, episodes: 12, genres: ['Action'],
    tags: ['Shounen', 'Super Power'], tagRanks: { Shounen: 90, 'Super Power': 80 },
  },
  {
    anilistId: 2, isAdult: false, episodes: 24, genres: ['Action'],
    tags: ['Shounen', 'Martial Arts'], tagRanks: { Shounen: 85, 'Martial Arts': 70 },
  },
  {
    anilistId: 3, isAdult: false, episodes: 12, genres: ['Romance'],
    tags: ['Love Triangle', 'School'], tagRanks: { 'Love Triangle': 88, School: 60 },
  },
  {
    anilistId: 4, isAdult: false, episodes: 11, genres: ['Romance'],
    tags: ['Love Triangle', 'Slice of Life'], tagRanks: { 'Love Triangle': 92, 'Slice of Life': 65 },
  },
  {
    anilistId: 5, isAdult: false, episodes: 13, genres: ['Mystery'],
    tags: ['Psychological', 'Thriller'], tagRanks: { Psychological: 95, Thriller: 85 },
  },
];

describe('RecommendationService (barycentre de tags + proximité cosinus)', () => {
  const service = new RecommendationService();

  it('deux profils différents produisent deux classements différents sur le même catalogue', () => {
    const actionRanking = service
      .getRecommendations({ catalog: CATALOG, likedAnilistIds: [1] })
      .map((a) => a.anilistId);
    const romanceRanking = service
      .getRecommendations({ catalog: CATALOG, likedAnilistIds: [4] })
      .map((a) => a.anilistId);

    expect(actionRanking).not.toEqual(romanceRanking);
    expect(actionRanking.indexOf(2)).toBeLessThan(actionRanking.indexOf(3));
    expect(romanceRanking.indexOf(3)).toBeLessThan(romanceRanking.indexOf(2));
  });

  it('le rank AniList limite les tags retenus (sélection), sans pondérer la similarité', () => {
    const manyTags: AnimeMetadata = {
      anilistId: 60, isAdult: false, episodes: 12, genres: [],
      tags: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      tagRanks: { A: 99, B: 95, C: 90, D: 85, E: 80, F: 75, G: 70, H: 65, I: 10, J: 5 },
    };
    const vector = toVector(manyTags);

    expect(vector.size).toBe(8);
    expect(vector.has('A')).toBe(true);
    expect(vector.has('I')).toBe(false);
    expect(vector.has('J')).toBe(false);
    expect([...vector.values()].every((w) => w === 1)).toBe(true);
  });

  it('la combinaison de plusieurs favoris élargit le profil de tags', () => {
    const hybrid: AnimeMetadata = {
      anilistId: 6, isAdult: false, episodes: 12, genres: ['Action', 'Romance'],
      tags: ['Shounen', 'Love Triangle'], tagRanks: { Shounen: 80, 'Love Triangle': 80 },
    };
    const catalogWithHybrid = [...CATALOG, hybrid];

    const results = service.getRecommendations({
      catalog: catalogWithHybrid,
      likedAnilistIds: [1, 4],
    });

    const hybridRank = results.findIndex((a) => a.anilistId === 6);
    const psychoRank = results.findIndex((a) => a.anilistId === 5);
    expect(hybridRank).toBeLessThan(psychoRank);
  });

  it('exclut les ids demandés via la chain de filtres', () => {
    const results = service.getRecommendations({
      catalog: CATALOG,
      likedAnilistIds: [1],
      excludedAnilistIds: new Set([2]),
    });
    expect(results.map((a) => a.anilistId)).not.toContain(2);
  });

  it('sans favoris, aucun profil de tags à comparer : score neutre', () => {
    const results = service.getRecommendations({ catalog: CATALOG, likedAnilistIds: [] });
    expect(results.every((r) => r.score === 0)).toBe(true);
  });

  it('chaque score est une similarité cosinus dans [0, 1]', () => {
    const results = service.getRecommendations({ catalog: CATALOG, likedAnilistIds: [1, 5] });
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});
