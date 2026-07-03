import type { Subscription } from '../../models/subscription.js';
import type { SubscriptionRepository } from '../subscription.repository.js';

export class InMemorySubscriptionRepository implements SubscriptionRepository {
  private readonly items = new Map<number, Subscription>(); // number, pas string
  private nextId = 1;

  async findAll(): Promise<Subscription[]> {
    return Array.from(this.items.values());
  }

  async findById(id: number): Promise<Subscription | null> {
    return this.items.get(id) ?? null;
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const id = subscription.id || this.nextId++;
    const saved = { ...subscription, id };
    this.items.set(id, saved);
    return saved;
  }

  async delete(id: number): Promise<void> {
    this.items.delete(id);
  }
}
