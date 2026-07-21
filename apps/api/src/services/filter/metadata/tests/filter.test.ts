// src/services/filter/metadata/tests/filter.test.ts
import { describe, it, expect } from 'vitest';
import {
  filterMetadataCandidates,
  type AnimeMetadata,
  type MetadataFilterParams,
} from '../filter.js';

const CATALOG: AnimeMetadata[] = [
  {
    anilistId: 1,
    isAdult: false,
    episodes: 12,
    tags: ['Isekai', 'Comedy'],
    genres: ['Action', 'Adventure'],
  },
  {
    anilistId: 2,
    isAdult: true,
    episodes: 24,
    tags: ['Ecchi'],
    genres: ['Romance'],
  },
  {
    anilistId: 3,
    isAdult: false,
    episodes: 1,
    tags: ['Drama'],
    genres: ['Drama', 'Psychological'],
  },
  {
    anilistId: 4,
    isAdult: false,
    episodes: 24,
    tags: ['Isekai', 'Action'],
    genres: ['Action'],
  },
];

describe('filterMetadataCandidates', () => {
  it('exclut les animes adultes quand allowAdult=false', () => {
    const params: MetadataFilterParams = {
      allowAdult: false,
      excludedAnilistIds: new Set(),
    };

    const result = filterMetadataCandidates(CATALOG, params);
    expect(result.map((a) => a.anilistId)).toEqual([1, 3, 4]);
  });

  it('exclut les animes déjà souscrits', () => {
    const params: MetadataFilterParams = {
      allowAdult: true,
      excludedAnilistIds: new Set([1, 4]),
    };

    const result = filterMetadataCandidates(CATALOG, params);
    expect(result.map((a) => a.anilistId)).toEqual([2, 3]);
  });

  it('filtre par tags (any)', () => {
    const params: MetadataFilterParams = {
      allowAdult: true,
      excludedAnilistIds: new Set(),
      requiredTags: ['Isekai'],
      tagMode: 'any',
    };

    const result = filterMetadataCandidates(CATALOG, params);
    expect(result.map((a) => a.anilistId)).toEqual([1, 4]);
  });

  it('compose adulte + exclusion + tags + genres', () => {
    const params: MetadataFilterParams = {
      allowAdult: false,
      excludedAnilistIds: new Set([1]),
      requiredTags: ['Isekai'],
      tagMode: 'any',
      requiredGenres: ['Action'],
      genreMode: 'any',
    };

    const result = filterMetadataCandidates(CATALOG, params);
    // 1 exclu (subscribed), 2 exclu (adult), 3 exclu (pas Isekai/Action), reste 4
    expect(result.map((a) => a.anilistId)).toEqual([4]);
  });
});

