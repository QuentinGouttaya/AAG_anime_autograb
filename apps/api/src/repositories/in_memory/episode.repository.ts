// repositories/in_memory/episode.repository.ts
import type { Episode, EpisodeStatus } from '../../models/episode.js';
import type { EpisodeRepository } from '../episode.repository.js';

export class InMemoryEpisodeRepository implements EpisodeRepository {
  private readonly items = new Map<number, Episode>();
  private nextId = 1;

  async findAll(): Promise<Episode[]> {
    return Array.from(this.items.values());
  }

  async findById(id: number): Promise<Episode | null> {
    return this.items.get(id) ?? null;
  }

  async findBySubscriptionId(subscriptionId: number): Promise<Episode[]> {
    return Array.from(this.items.values()).filter(
      (episode) => episode.subscriptionId === subscriptionId,
    );
  }

  async findByStatus(status: EpisodeStatus): Promise<Episode[]> {
    return Array.from(this.items.values()).filter(
      (episode) => episode.status === status,
    );
  }

  async save(episode: Episode): Promise<Episode> {
    const id = episode.id || this.nextId++;
    const saved = { ...episode, id };
    this.items.set(id, saved);
    return saved;
  }

  async delete(id: number): Promise<void> {
    this.items.delete(id);
  }
}
