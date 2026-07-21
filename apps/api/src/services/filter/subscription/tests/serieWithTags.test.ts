// src/services/filter/subscription/tests/serieWithTags.filter.test.ts
import { describe, it, expect } from 'vitest';
import { filterSubscribedSeries } from '../filter.js';
import type { SerieWithTags } from '../../../../models/serie.js';
import type { Tag } from '../../../../models/tag.js';

describe('filterSubscribedSeries by tags', () => {
  const mkTag = (id: number, name: string): Tag => ({
    id,
    name,
    isAdult: false,
  });

  const series: SerieWithTags[] = [
    {
      id: 1,
      anilistId: 100,
      canonicalTitle: 'Shonen action',
      tags: [mkTag(1, 'Action'), mkTag(2, 'Shonen')],
    },
    {
      id: 2,
      anilistId: 200,
      canonicalTitle: 'Romance school',
      tags: [mkTag(3, 'Romance'), mkTag(4, 'School')],
    },
  ];

  it('garde les séries qui ont au moins un tag demandé', () => {
    const filtered = filterSubscribedSeries(series, { includeTags: ['Action'] });

    expect(filtered.map((s) => s.id)).toEqual([1]);
  });
});
