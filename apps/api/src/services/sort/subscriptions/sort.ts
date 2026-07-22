import type { SortStrategy } from '../sort.js';
import type { SubscriptionWithSerie } from '../../../models/subscription_episode.js';
import type { SortDirection } from '../../../models/sort.js';

export class CreatedAtSort implements SortStrategy<SubscriptionWithSerie> {
  constructor(private readonly direction: SortDirection = 'desc') { }

  sort(items: SubscriptionWithSerie[]): SubscriptionWithSerie[] {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      const res = aTime - bTime;
      return this.direction === 'asc' ? res : -res;
    });
  }
}

export class SeriesTitleSort implements SortStrategy<SubscriptionWithSerie> {
  constructor(private readonly direction: SortDirection = 'asc') { }

  sort(items: SubscriptionWithSerie[]): SubscriptionWithSerie[] {
    return [...items].sort((a, b) => {
      const aTitle = a.serie?.canonicalTitle ?? '';
      const bTitle = b.serie?.canonicalTitle ?? '';
      const res = aTitle.localeCompare(bTitle, undefined, {
        sensitivity: 'base',
        numeric: true
      });
      return this.direction === 'asc' ? res : -res;
    });
  }
}

export class EpisodeCountSort implements SortStrategy<SubscriptionWithSerie> {
  constructor(private readonly direction: SortDirection = 'desc') { }

  sort(items: SubscriptionWithSerie[]): SubscriptionWithSerie[] {
    return [...items].sort((a, b) => {
      const res = (a.episodeCount ?? 0) - (b.episodeCount ?? 0);
      return this.direction === 'asc' ? res : -res;
    });
  }
}
