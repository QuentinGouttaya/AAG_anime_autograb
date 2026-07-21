// src/repositories/in_memory/episode.repository.ts
import type { Episode } from '../../models/episode.js';
import type { EpisodeRepository } from '../episode.repository.js';

export class InMemoryEpisodeRepository implements EpisodeRepository {
  private readonly episodes = new Map<number, Episode>();
  private nextId = 1;

  async findAll(): Promise<Episode[]> {
    return [...this.episodes.values()];
  }

  async findById(id: number): Promise<Episode | null> {
    return this.episodes.get(id) ?? null;
  }

  async findBySerieId(serieId: number): Promise<Episode[]> {
    return [...this.episodes.values()].filter(
      (episode) => episode.serieId === serieId,
    );
  }

  async save(episode: Episode): Promise<Episode> {
    const id = episode.id || this.nextId++;

    const saved: Episode = {
      ...episode,
      id,
    };

    this.episodes.set(id, saved);

    return saved;
  }

  async delete(id: number): Promise<void> {
    this.episodes.delete(id);
  }
}
