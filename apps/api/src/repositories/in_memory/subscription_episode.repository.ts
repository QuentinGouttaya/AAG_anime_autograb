import type {
  EpisodeStatus,
  SubscriptionEpisode,
} from '../../models/subscription_episode.js';
import type { SubscriptionEpisodeRepository } from '../subscription_episode.repository.js';

export class InMemorySubscriptionEpisodeRepository
  implements SubscriptionEpisodeRepository {
  private readonly entries = new Map<string, SubscriptionEpisode>();

  private key(subscriptionId: number, episodeId: number): string {
    return `${subscriptionId}:${episodeId}`;
  }

  async findBySubscriptionId(
    subscriptionId: number,
  ): Promise<SubscriptionEpisode[]> {
    return [...this.entries.values()].filter(
      (entry) => entry.subscriptionId === subscriptionId,
    );
  }

  async findByStatus(
    status: EpisodeStatus,
  ): Promise<SubscriptionEpisode[]> {
    return [...this.entries.values()].filter(
      (entry) => entry.status === status,
    );
  }

  async upsert(
    entry: SubscriptionEpisode,
  ): Promise<SubscriptionEpisode> {
    this.entries.set(
      this.key(entry.subscriptionId, entry.episodeId),
      entry,
    );

    return entry;
  }

  async delete(
    subscriptionId: number,
    episodeId: number,
  ): Promise<void> {
    this.entries.delete(this.key(subscriptionId, episodeId));
  }
}
