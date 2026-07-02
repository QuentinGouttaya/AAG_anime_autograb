import type { Episode } from "@aag/domain";
import type { EpisodeRepository } from "../episode.repository.js";

export class InMemoryEpisodeRepository implements EpisodeRepository {
  private items = new Map<number, Episode>();
  private nextId = 1;

  async create(ep: Omit<Episode, "id">) {
    const created = { ...ep, id: this.nextId++ };
    this.items.set(created.id, created);
    return created;
  }

  async findById(id: number) {
    return this.items.get(id) ?? null;
  }

  async findBySubscriptionId(subId: number) {
    return [...this.items.values()].filter(e => e.subscriptionId === subId);
  }

  async update(id: number, patch: Partial<Episode>) {
    const existing = this.items.get(id);
    if (!existing) throw new Error(`Episode ${id} not found`);
    const updated = { ...existing, ...patch };
    this.items.set(id, updated);
    return updated;
  }
}
