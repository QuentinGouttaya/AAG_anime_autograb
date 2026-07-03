// services/subscription.service.ts
import type { Subscription } from '@aag/domain';
import type { SubscriptionRepository } from '../repositories/subscription.repository.js';
import type { SerieRepository } from '../repositories/serie.repository.js';
import type { AnilistService } from './anilist.service.js';

export class SubscriptionNotFoundError extends Error {
  readonly code = 404;
  constructor(id: number) {
    super(`Subscription not found: ${id}`);
  }
}

export class AnimeNotFoundError extends Error {
  readonly code = 422;
  constructor(anilistId: number) {
    super(`Anime not found on AniList: ${anilistId}`);
  }
}

interface CreateSubscriptionInput {
  anilistId: number;
  preferredFansub: string[];
  preferredResolution: string;
  minSeeders: number;
}

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly serieRepository: SerieRepository,
    private readonly anilistService: AnilistService,
  ) { }

  async getAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.findAll();
  }

  async getById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findById(id);
  }

  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    let serie = await this.serieRepository.findByAnilistId(input.anilistId);

    if (!serie) {
      const anime = await this.anilistService.getAnimeById(input.anilistId);

      if (!anime) {
        throw new AnimeNotFoundError(input.anilistId);
      }

      serie = {
        id: Date.now(),
        anilistId: anime.id,
        canonicalTitle: anime.title.romaji,
      };

      await this.serieRepository.save(serie);
    }

    const subscription: Subscription = {
      id: Date.now(),
      seriesId: serie.id,
      preferredFansub: input.preferredFansub,
      preferredResolution: input.preferredResolution,
      minSeeders: input.minSeeders,
      active: true,
      createdAt: Date.now().toString(),
    };

    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  async delete(id: number): Promise<void> {
    const existing = await this.subscriptionRepository.findById(id);

    if (!existing) {
      throw new SubscriptionNotFoundError(id);
    }

    await this.subscriptionRepository.delete(id);
  }
}
