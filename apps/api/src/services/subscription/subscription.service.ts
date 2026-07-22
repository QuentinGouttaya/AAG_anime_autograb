import type { Subscription } from '../../models/subscription.js';
import type { Serie } from '../../models/serie.js';
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js';
import type { SerieRepository } from '../../repositories/serie.repository.js';
import type { MetadataService } from '../metadata/metadata.service.js';
import { SubscriptionNotFoundError, AnimeNotFoundError } from './error.js';
import type { CreateSubscriptionInput } from './types.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';
import type { SubscriptionWithSerie } from '../../models/subscription_episode.js';
import type { SubscriptionSortKey } from '../../models/subscription.js';
import {
  filterSubscriptions,
  type SubscriptionFilterParams,
} from '../filter/subscription/filter.js';
import {
  CreatedAtSort,
  SeriesTitleSort,
  EpisodeCountSort,
} from '../sort/subscriptions/sort.js';
import type { SortStrategy } from '../sort/sort.js';
import type { SortDirection } from '../../models/sort.js';

export type { SubscriptionWithSerie, SubscriptionSortKey };

export interface SubscriptionQueryParams extends SubscriptionFilterParams {
  sort?: SubscriptionSortKey;
  direction?: SortDirection;
}

const SORT_STRATEGIES: Record<SubscriptionSortKey, (dir: SortDirection) => SortStrategy<SubscriptionWithSerie>> = {
  createdAt: (dir) => new CreatedAtSort(dir),
  title: (dir) => new SeriesTitleSort(dir),
  episodeCount: (dir) => new EpisodeCountSort(dir),
};

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly serieRepository: SerieRepository,
    private readonly metadataService: MetadataService,
    private readonly episodeRepository: EpisodeRepository,
  ) { }

  // Joint la série, puis filtre (chain of responsibility) et trie (strategy) côté backend
  async getAll(params: SubscriptionQueryParams = {}): Promise<SubscriptionWithSerie[]> {
    const subs = await this.subscriptionRepository.findAll();

    const withSerie = await Promise.all(
      subs.map(async (sub) => {
        const serie = await this.serieRepository.findById(sub.seriesId);
        const tags = serie ? await this.serieRepository.findTagsBySerieId(serie.id) : [];

        return {
          ...sub,
          serie: serie
            ? {
              ...serie,
              tags,
              genres: serie.genres ?? [],
            }
            : {
              id: sub.seriesId,
              anilistId: 0,
              canonicalTitle: `Serie #${sub.seriesId}`,
              episodeCount: null,
              genres: [],
              tags: [],
            },
        };
      }),
    );

    const filtered = filterSubscriptions(withSerie, params);

    const sortKey = params.sort ?? 'createdAt';
    const strategy = SORT_STRATEGIES[sortKey]?.(params.direction ?? 'desc');
    return strategy ? strategy.sort(filtered) : filtered;
  }

  async getById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findById(id);
  }

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const serie = await this.getOrCreateSerie(input.anilistId);

    return this.subscriptionRepository.save({
      id: 0,
      seriesId: serie.id,
      preferredFansub: input.preferredFansub,
      preferredResolution: input.preferredResolution,
      minSeeders: input.minSeeders,
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  async delete(id: number): Promise<void> {
    const existing = await this.subscriptionRepository.findById(id);
    if (!existing) throw new SubscriptionNotFoundError(id);
    await this.subscriptionRepository.delete(id);
  }

  private async getOrCreateSerie(anilistId: number) {
    const existing = await this.serieRepository.findByAnilistId(anilistId);

    if (existing) {
      // Resync des entrées stale : créées avant que romaji/cover/status/format/
      // episodeCount soient persistés, ou dont les épisodes n'ont jamais été
      // sauvegardés. Sans ça, une série cassée en base le reste pour toujours.
      const existingEpisodes = await this.episodeRepository.findBySerieId(existing.id);
      const isStale = existing.episodeCount == null || existingEpisodes.length === 0;
      if (!isStale) return existing;

      const anime = await this.metadataService.getAnimeById(anilistId);
      if (!anime) return existing;

      const serie = await this.serieRepository.save({
        ...anime,
        id: existing.id,
      });

      await this.serieRepository.saveTags(serie.id, anime.tags);
      if (existingEpisodes.length === 0) {
        await Promise.all(
          anime.episodes.map((episode) =>
            this.episodeRepository.save({ ...episode, serieId: serie.id }),
          ),
        );
      }
      return serie;
    }

    const anime = await this.metadataService.getAnimeById(anilistId);
    if (!anime) throw new AnimeNotFoundError(anilistId);

    const serie = await this.serieRepository.save({
      ...anime,
      id: 0,
    });

    await this.serieRepository.saveTags(serie.id, anime.tags);
    await Promise.all(
      anime.episodes.map((episode) =>
        this.episodeRepository.save({ ...episode, serieId: serie.id }),
      ),
    );
    return serie;
  }
}
