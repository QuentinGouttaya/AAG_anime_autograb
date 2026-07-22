import { describe, it, expect } from 'vitest';
import { filterSubscriptions } from '../filter.js';
import type { SubscriptionWithSerie } from '../../../../models/subscription_episode.js';

const mkSub = (
  id: number,
  overrides: Partial<SubscriptionWithSerie> & {
    title?: string;
    genres?: string[];
  } = {},
): SubscriptionWithSerie => ({
  id,
  seriesId: id,
  preferredFansub: [],
  preferredResolution: '1080p',
  minSeeders: 1,
  active: overrides.active ?? true,
  createdAt: new Date().toISOString(),
  serie: {
    id,
    anilistId: id * 100,
    canonicalTitle: overrides.title ?? `Serie ${id}`,
    genres: overrides.genres ?? [],
    tags: [],
  },
});

describe('filterSubscriptions', () => {
  const subs = [
    mkSub(1, { title: 'Shonen Action', genres: ['Action'], active: true }),
    mkSub(2, { title: 'Romance School', genres: ['Romance'], active: false }),
  ];

  it('filtre par statut actif', () => {
    expect(filterSubscriptions(subs, { status: 'active' }).map((s) => s.id)).toEqual([1]);
  });

  it('filtre par recherche titre', () => {
    expect(filterSubscriptions(subs, { search: 'romance' }).map((s) => s.id)).toEqual([2]);
  });

  it('filtre par genre', () => {
    expect(filterSubscriptions(subs, { genre: 'Action' }).map((s) => s.id)).toEqual([1]);
  });

  it('sans params, ne filtre rien', () => {
    expect(filterSubscriptions(subs, {})).toHaveLength(2);
  });
});
