import type { Episode } from '../../models/episode.js';
import type {
  EpisodeStatus,
  SubscriptionEpisode,
} from '../../models/subscription_episode.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';
import type { SubscriptionEpisodeRepository } from '../../repositories/subscription_episode.repository.js';
import type { DebridProvider } from '../debrid/debrid.service.js';
import {
  EpisodeLinkUnavailableError,
  EpisodeNotFoundError,
} from './error.js';
import type { CreatePendingEpisodeInput } from './types.js';

export class EpisodeService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly subscriptionEpisodeRepository: SubscriptionEpisodeRepository,
    private readonly debridProvider: DebridProvider,
  ) { }

  async list(): Promise<Episode[]> {
    return this.episodeRepository.findAll();
  }

  async getDetails(id: number): Promise<Episode | null> {
    return this.episodeRepository.findById(id);
  }

  async listAvailableFiles(): Promise<SubscriptionEpisode[]> {
    return this.subscriptionEpisodeRepository.findByStatus('found');
  }

  async createPending(
    input: CreatePendingEpisodeInput,
  ): Promise<SubscriptionEpisode> {
    return this.subscriptionEpisodeRepository.upsert({
      subscriptionId: input.subscriptionId,
      episodeId: input.episodeId,
      status: 'pending',
      grabbedAt: null,
    });
  }

  async resolveDownloadLink(
    subscriptionId: number,
    episodeId: number,
    magnetOrTorrentUrl: string,
  ): Promise<SubscriptionEpisode> {
    const links = await this.debridProvider.getDirectDownloadLink(
      magnetOrTorrentUrl,
    );

    if (links.length === 0) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');
      throw new EpisodeLinkUnavailableError(episodeId);
    }

    return this.updateStatus(subscriptionId, episodeId, 'found');
  }

  private async updateStatus(
    subscriptionId: number,
    episodeId: number,
    status: EpisodeStatus,
  ): Promise<SubscriptionEpisode> {
    const entries = await this.subscriptionEpisodeRepository
      .findBySubscriptionId(subscriptionId);

    const entry = entries.find((item) => item.episodeId === episodeId);

    if (!entry) {
      throw new EpisodeNotFoundError(episodeId);
    }

    return this.subscriptionEpisodeRepository.upsert({
      ...entry,
      status,
      grabbedAt:
        status === 'found' || status === 'added' || status === 'ready'
          ? new Date().toISOString()
          : entry.grabbedAt,
    });
  }
}
