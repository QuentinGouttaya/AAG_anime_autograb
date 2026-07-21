// src/services/filter/subscription/filter.ts
import { AbstractFilter, applyFilterChain, type FilterHandler } from '../index.js';
import type { Subscription } from '../../../models/subscription.js';
import type { SerieWithTags } from '../../../models/serie.js';


class ActiveFilter extends AbstractFilter<Subscription> {
  protected check(sub: Subscription): boolean {
    return sub.active;
  }
}

export interface SubscriptionFilterParams {
  onlyActive?: boolean;
}

export function buildSubscriptionFilterChain(
  params: SubscriptionFilterParams,
): FilterHandler<Subscription> {
  let head: FilterHandler<Subscription> | null = null;
  let current: FilterHandler<Subscription> | null = null;

  if (params.onlyActive) {
    const active = new ActiveFilter();
    head = active;
    current = active;
  }
  //NOOP === No Operation Expression
  if (!head || !current) {
    class NoopFilter extends AbstractFilter<Subscription> {
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
  subs: Subscription[],
  params: SubscriptionFilterParams,
): Subscription[] {
  return applyFilterChain(subs, () => buildSubscriptionFilterChain(params));
}

export interface SerieSubscriptionFilterParams {
  includeTags?: string[];
}

class SerieTagsFilter extends AbstractFilter<SerieWithTags> {
  constructor(private readonly includeTags: string[]) {
    super();
  }

  protected check(serie: SerieWithTags): boolean {
    if (this.includeTags.length === 0) return true;

    const tagNames = serie.tags.map((t) => t.name);
    return this.includeTags.some((required) => tagNames.includes(required));
  }
}

export function buildSerieSubscriptionFilterChain(
  params: SerieSubscriptionFilterParams,
): FilterHandler<SerieWithTags> {
  let head: FilterHandler<SerieWithTags> | null = null;
  let current: FilterHandler<SerieWithTags> | null = null;

  if (params.includeTags && params.includeTags.length > 0) {
    const tagsFilter = new SerieTagsFilter(params.includeTags);
    head = tagsFilter;
    current = tagsFilter;
  }

  if (!head || !current) {
    class NoopFilter extends AbstractFilter<SerieWithTags> {
      protected check(): boolean {
        return true;
      }
    }
    head = new NoopFilter();
    current = head;
  }

  return head;
}

export function filterSubscribedSeries(
  series: SerieWithTags[],
  params: SerieSubscriptionFilterParams,
): SerieWithTags[] {
  return applyFilterChain(series, () => buildSerieSubscriptionFilterChain(params));
}
