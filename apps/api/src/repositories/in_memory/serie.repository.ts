import type { Serie } from '@aag/domain';
import type { SerieRepository } from '../serie.repository.js';

export class InMemorySerieRepository implements SerieRepository {
  private readonly items = new Map<number, Serie>();
  private nextId = 1;

  async findById(id: number): Promise<Serie | null> {
    return this.items.get(id) ?? null;
  }

  async findByAnilistId(anilistId: number): Promise<Serie | null> {
    for (const series of this.items.values()) {
      if (series.anilistId === anilistId) {
        return series;
      }
    }
    return null;
  }

  async save(serie: Serie): Promise<void> {
    const id = serie.id || this.nextId++;
    this.items.set(id, { ...serie, id });
  }
}
