import type { Serie } from '../../models/serie.js';
import type { SerieRepository } from '../serie.repository.js';

export class InMemorySerieRepository implements SerieRepository {
  private readonly items = new Map<number, Serie>();
  private nextId = 1;

  async findById(id: number): Promise<Serie | null> {
    return this.items.get(id) ?? null;
  }

  async findByAnilistId(anilistId: number): Promise<Serie | null> {
    for (const serie of this.items.values()) {
      if (serie.anilistId === anilistId) {
        return serie;
      }
    }
    return null;
  }

  async save(serie: Serie): Promise<Serie> {
    const id = serie.id || this.nextId++;
    const saved = { ...serie, id };
    this.items.set(id, saved);
    return saved;
  }

  async delete(id: number): Promise<void> {
    this.items.delete(id);
  }
}
