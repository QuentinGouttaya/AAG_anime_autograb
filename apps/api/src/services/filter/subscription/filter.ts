import { AbstractFilter, applyFilterChain, type FilterHandler } from '../index.js';
import type { SubscriptionWithSerie } from '../../../models/subscription_episode.js';

export interface SubscriptionFilterParams {
  status?: 'active' | 'inactive';
  search?: string;
  genre?: string;
  animeStatus?: string;
  format?: string;
}

class StatusFilter extends AbstractFilter<SubscriptionWithSerie> {
  constructor(private readonly status: 'active' | 'inactive') {
    super();
  }

  protected check(sub: SubscriptionWithSerie): boolean {
    if (this.status === 'active') return sub.active;
    return !sub.active;
  }
}

class SearchFilter extends AbstractFilter<SubscriptionWithSerie> {
  constructor(private readonly searchTerm: string) {
    super();
  }

  protected check(sub: SubscriptionWithSerie): boolean {
    const search = this.searchTerm.toLowerCase();
    const title = sub.serie?.canonicalTitle?.toLowerCase() ?? '';
    const anilistId = String(sub.serie?.anilistId ?? '');

    return title.includes(search) || anilistId.includes(search);
  }
}

class GenreFilter extends AbstractFilter<SubscriptionWithSerie> {
  constructor(private readonly genre: string) {
    super();
  }

  protected check(sub: SubscriptionWithSerie): boolean {
    const genres = sub.serie?.genres ?? [];
    return genres.includes(this.genre);
  }
}

class AnimeStatusFilter extends AbstractFilter<SubscriptionWithSerie> {
  constructor(private readonly animeStatus: string) {
    super();
  }

  protected check(sub: SubscriptionWithSerie): boolean {
    return sub.serie?.status === this.animeStatus;
  }
}

class FormatFilter extends AbstractFilter<SubscriptionWithSerie> {
  constructor(private readonly format: string) {
    super();
  }

  protected check(sub: SubscriptionWithSerie): boolean {
    return sub.serie?.format === this.format;
  }
}

export function buildSubscriptionFilterChain(
  params: SubscriptionFilterParams,
): FilterHandler<SubscriptionWithSerie> {
  let head: FilterHandler<SubscriptionWithSerie> | null = null;
  let current: FilterHandler<SubscriptionWithSerie> | null = null;

  if (params.status) {
    const filter = new StatusFilter(params.status);
    head = filter;
    current = filter;
  }

  if (params.search) {
    const filter = new SearchFilter(params.search);
    if (!head) {
      head = filter;
      current = filter;
    } else if (current) {
      current.setNext(filter);
      current = filter;
    }
  }

  if (params.genre) {
    const filter = new GenreFilter(params.genre);
    if (!head) {
      head = filter;
      current = filter;
    } else if (current) {
      current.setNext(filter);
      current = filter;
    }
  }

  if (params.animeStatus) {
    const filter = new AnimeStatusFilter(params.animeStatus);
    if (!head) {
      head = filter;
      current = filter;
    } else if (current) {
      current.setNext(filter);
      current = filter;
    }
  }

  if (params.format) {
    const filter = new FormatFilter(params.format);
    if (!head) {
      head = filter;
      current = filter;
    } else if (current) {
      current.setNext(filter);
      current = filter;
    }
  }

  // NOOP si aucun filtre
  if (!head || !current) {
    class NoopFilter extends AbstractFilter<SubscriptionWithSerie> {
      protected check(): boolean {
        return true;
      }
    }
    head = new NoopFilter();
    current = head;
  }

  return head;
}

export function filterSubscriptions(
  subs: SubscriptionWithSerie[],
  params: SubscriptionFilterParams,
): SubscriptionWithSerie[] {
  return applyFilterChain(subs, () => buildSubscriptionFilterChain(params));
}
