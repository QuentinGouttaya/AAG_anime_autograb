// src/services/filter/subscription/tests/subscription.filter.integration.test.ts
import { describe, it, expect } from 'vitest';

interface TestSerie {
  id: number;
  title: string;
  tags: string[];
}

interface TestSubscription {
  id: number;
  serieId: number;
  active: boolean;
}

function filterSubscriptionsBySerieTags(
  subscriptions: TestSubscription[],
  series: TestSerie[],
  includeTags: string[],
): TestSubscription[] {
  if (includeTags.length === 0) return subscriptions;

  return subscriptions.filter((sub) => {
    const serie = series.find((s) => s.id === sub.serieId);
    if (!serie) return false;
    return serie.tags.some((tag) => includeTags.includes(tag));
  });
}

describe('filterSubscriptionsBySerieTags', () => {
  const series: TestSerie[] = [
    { id: 1, title: 'Shonen action', tags: ['Action', 'Shonen'] },
    { id: 2, title: 'Romance school', tags: ['Romance', 'School'] },
    { id: 3, title: 'Sci-fi drama', tags: ['Sci-Fi', 'Drama'] },
  ];

  const subs: TestSubscription[] = [
    { id: 101, serieId: 1, active: true },
    { id: 102, serieId: 2, active: true },
    { id: 103, serieId: 3, active: true },
  ];

  it('garde seulement les subscriptions dont la série a au moins un tag demandé', () => {
    const filtered = filterSubscriptionsBySerieTags(subs, series, ['Action', 'Sci-Fi']);
    expect(filtered.map((s) => s.id).sort()).toEqual([101, 103]);
  });

  it('sans tags demandés, ne filtre rien', () => {
    const filtered = filterSubscriptionsBySerieTags(subs, series, []);
    expect(filtered.map((s) => s.id).sort()).toEqual([101, 102, 103]);
  });
});
