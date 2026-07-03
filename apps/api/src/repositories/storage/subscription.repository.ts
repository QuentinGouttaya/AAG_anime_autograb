import type { Subscription } from '@aag/domain';
import type { SubscriptionRepository } from '../subscription.repository.js';

export class PostgresSubscriptionRepository implements SubscriptionRepository {
  async findAll(): Promise<Subscription[]> {
    throw new Error('Not implemented');
  }

  async findById(id: number): Promise<Subscription | null> {
    throw new Error('Not implemented');
  }

  async save(subscription: Subscription): Promise<Subscription> {
    throw new Error('Not implemented');
  }

  async delete(id: number): Promise<void> {
    throw new Error('Not implemented');
  }
}
