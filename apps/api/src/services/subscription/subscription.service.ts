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
    let serie = await this.serieRepository.findByAnilistId(input.anilistId);

    if (!serie) {
      const anime = await this.metadataService.getAnimeById(input.anilistId);
      if (!anime) throw new AnimeNotFoundError(input.anilistId);

      serie = await this.serieRepository.save({
        id: 0,
        anilistId: anime.anilistId,
        canonicalTitle: anime.canonicalTitle,
      });
    }

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
}
