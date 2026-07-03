import type { Subscription } from '../models/subscription.js';

export interface SubscriptionRepository {
  findAll(): Promise<Subscription[]>;
  findById(id: number): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<Subscription>;
  delete(id: number): Promise<void>;
}
