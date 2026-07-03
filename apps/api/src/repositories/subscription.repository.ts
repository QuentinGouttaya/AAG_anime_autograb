import type { Subscription } from '@aag/domain';

export interface SubscriptionRepository {
  findAll(): Promise<Subscription[]>;
  findById(id: number): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<Subscription>;
  delete(id: number): Promise<void>;
}
