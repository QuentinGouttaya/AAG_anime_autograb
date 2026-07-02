// services/episode.service.ts
import type { Episode, EpisodeStatus } from '@aag/domain';
import type { EpisodeRepository } from '../repositories/episode.repository.js';
import type { PremiumizeService } from './premiumize.service.js';

export class EpisodeNotFoundError extends Error {
  readonly code = 404;
  constructor(id: number) {
    super(`Episode not found: ${id}`);
  }
}

export class EpisodeLinkUnavailableError extends Error {
  readonly code = 422;
  constructor(id: number) {
    super(`No downloadable link found for episode: ${id}`);
  }
}

interface CreatePendingEpisodeInput {
  subscriptionId: number;
  episodeNumber: number;
}

export class EpisodeService {
  constructor(
    private readonly episodeRepository: EpisodeRepository,
    private readonly premiumizeService: PremiumizeService,
  ) { }

  async list(): Promise<Episode[]> {
    return this.episodeRepository.findAll();
  }

  async getDetails(id: number): Promise<Episode | null> {
    return this.episodeRepository.findById(id);
  }

  async listAvailableFiles(): Promise<Episode[]> {
    return this.episodeRepository.findByStatus('found');
  }

  async createPending(input: CreatePendingEpisodeInput): Promise<Episode> {
    const episode: Episode = {
      id: 0,
      subscriptionId: input.subscriptionId,
      episodeNumber: input.episodeNumber,
      status: 'pending',
    };
    return this.episodeRepository.save(episode);
  }

  async resolveDownloadLink(id: number, magnetOrTorrentUrl: string): Promise<Episode> {
    const episode = await this.episodeRepository.findById(id);
    if (!episode) throw new EpisodeNotFoundError(id);

    const files = await this.premiumizeService.getDirectDownloadLink(magnetOrTorrentUrl);
    if (files.length === 0) {
      await this.updateStatus(id, 'failed');
      throw new EpisodeLinkUnavailableError(id);
    }

    return this.updateStatus(id, 'found');
  }

  private async updateStatus(id: number, status: EpisodeStatus): Promise<Episode> {
    const episode = await this.episodeRepository.findById(id);
    if (!episode) throw new EpisodeNotFoundError(id);
    return this.episodeRepository.save({ ...episode, status });
  }
}
