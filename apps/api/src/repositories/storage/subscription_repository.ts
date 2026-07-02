export interface SubscriptionRepository {
  create(sub: Omit<Subscription, "id" >): Promise<Subscription>;
  findById(id: number): Promise<Subscription | null>;
  findAll(): Promise<Subscription[]>;
  delete(id: number): Promise<void>;
}
