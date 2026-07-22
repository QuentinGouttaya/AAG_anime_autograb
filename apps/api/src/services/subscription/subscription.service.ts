import type { Subscription } from '../../models/subscription.js';
import type { Serie } from '../../models/serie.js';
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js';
import type { SerieRepository } from '../../repositories/serie.repository.js';
import type { MetadataService } from '../metadata/metadata.service.js';
import { SubscriptionNotFoundError, AnimeNotFoundError } from './error.js';
import type { CreateSubscriptionInput } from './types.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';

// ← AJOUTÉ : type de retour avec la série jointe
export type SubscriptionWithSerie = Subscription & { serie: Serie };

export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly serieRepository: SerieRepository,
    private readonly metadataService: MetadataService,
    private readonly episodeRepository: EpisodeRepository,
  ) { }

  // ← MODIFIÉ : joint la série
  async getAll(): Promise<SubscriptionWithSerie[]> {
    const subs = await this.subscriptionRepository.findAll();

    return Promise.all(
      subs.map(async (sub) => {
        const serie = await this.serieRepository.findById(sub.seriesId);
        return {
          ...sub,
          serie: serie ?? {
            id: sub.seriesId,
            anilistId: 0,
            canonicalTitle: `Serie #${sub.seriesId}`,
          },
        };
      }),
    );
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
    await Promise.all(
      anime.episodes.map((episode) =>
        this.episodeRepository.save({ ...episode, serieId: serie.id }),
      ),
    );
    return serie;
  }
}
