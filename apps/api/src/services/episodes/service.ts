// services/episode.service.ts
import type { Episode } from '../../models/episode.js';
import type { SubscriptionEpisode, EpisodeStatus } from '../../models/subscription_episode.js';
import type { EpisodeRepository } from '../../repositories/episode.repository.js';
import type { SubscriptionEpisodeRepository } from '../../repositories/storage/db/subscription_episode.repository.js';
import type { DebridProvider } from '../../services/debrid/debrid.service.js';
import { EpisodeNotFoundError, EpisodeLinkUnavailableError } from './error.js';
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

  async createPending(input: CreatePendingEpisodeInput): Promise<SubscriptionEpisode> {
    // Create a tracking record, NOT a physical Episode
    const trackingRecord: SubscriptionEpisode = {
      subscriptionId: input.subscriptionId,
      episodeId: input.episodeId,
      status: 'pending',
      grabbedAt: null,
    };
    return this.subscriptionEpisodeRepository.upsert(trackingRecord);
  }

  async resolveDownloadLink(
    subscriptionId: number,
    episodeId: number,
    magnetOrTorrentUrl: string
  ): Promise<SubscriptionEpisode> {
    const files = await this.debridProvider.getDirectDownloadLink(magnetOrTorrentUrl);

    if (files.length === 0) {
      await this.updateStatus(subscriptionId, episodeId, 'failed');
      throw new EpisodeLinkUnavailableError(episodeId);
    }

    return this.updateStatus(subscriptionId, episodeId, 'found');
  }

  private async updateStatus(
    subscriptionId: number,
    episodeId: number,
    status: EpisodeStatus
  ): Promise<SubscriptionEpisode> {
    const records = await this.subscriptionEpisodeRepository.findBySubscriptionId(subscriptionId);
    const record = records.find(r => r.episodeId === episodeId);

    if (!record) throw new EpisodeNotFoundError(episodeId);

    return this.subscriptionEpisodeRepository.upsert({
      ...record,
      status,
      grabbedAt: (status === 'found' || status === 'added' || status === 'ready')
        ? new Date().toISOString()
        : record.grabbedAt
    });
  }
}
