import type { Episode, EpisodeStatus } from '@aag/domain';

export interface EpisodeRepository {
  findAll(): Promise<Episode[]>;
  findById(id: number): Promise<Episode | null>;
  findBySubscriptionId(subscriptionId: number): Promise<Episode[]>;
  findByStatus(status: EpisodeStatus): Promise<Episode[]>;
  save(episode: Episode): Promise<Episode>;
  delete(id: number): Promise<void>;
}
