// services/subscription/subscription.service.ts
import type { Subscription } from '../../models/subscription.js';
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js';
import type { SerieRepository } from '../../repositories/serie.repository.js';
import type { MetadataService } from '../metadata/metadata.service.js';
import { SubscriptionNotFoundError, AnimeNotFoundError } from './error.js';
import type { CreateSubscriptionInput } from './types.js';

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly serieRepository: SerieRepository,
    private readonly metadataService: MetadataService,
  ) { }

  async getAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.findAll();
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
    if (existing) return existing;

    const anime = await this.metadataService.getAnimeById(anilistId);
    if (!anime) throw new AnimeNotFoundError(anilistId);

    const serie = await this.serieRepository.save({
      id: 0,
      anilistId: anime.anilistId,
      canonicalTitle: anime.canonicalTitle,
    });

    await this.serieRepository.saveTags(serie.id, anime.tags);

    return serie;
  }
}
