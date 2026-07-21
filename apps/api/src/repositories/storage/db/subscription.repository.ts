import { asc, eq } from 'drizzle-orm';
import type { Database } from '../index.js';

import type { Subscription } from '../../../models/subscription.js';
import type { SubscriptionRepository } from '../../subscription.repository.js';

import { subscriptions } from './schema.js';

function toSubscription(
  row: typeof subscriptions.$inferSelect,
): Subscription {
  return {
    id: row.id,
    seriesId: row.seriesId,
    preferredFansub: row.preferredFansub,
    preferredResolution: row.preferredResolution,
    minSeeders: row.minSeeders,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PostgresSubscriptionRepository
  implements SubscriptionRepository {
  constructor(private readonly db: Database) { }

  async findAll(): Promise<Subscription[]> {
    const rows = await this.db
      .select()
      .from(subscriptions)
      .orderBy(asc(subscriptions.id));

    return rows.map(toSubscription);
  }

  async findById(id: number): Promise<Subscription | null> {
    const [row] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));

    return row ? toSubscription(row) : null;
  }

  async save(subscription: Subscription): Promise<Subscription> {
    if (subscription.id === 0) {
      const [row] = await this.db
        .insert(subscriptions)
        .values({
          seriesId: subscription.seriesId,
          preferredFansub: subscription.preferredFansub,
          preferredResolution: subscription.preferredResolution,
          minSeeders: subscription.minSeeders,
          active: subscription.active,
          createdAt: new Date(subscription.createdAt),
        })
        .returning();

      return toSubscription(row);
    }

    const [row] = await this.db
      .update(subscriptions)
      .set({
        seriesId: subscription.seriesId,
        preferredFansub: subscription.preferredFansub,
        preferredResolution: subscription.preferredResolution,
        minSeeders: subscription.minSeeders,
        active: subscription.active,
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    return toSubscription(row);
  }

  async delete(id: number): Promise<void> {
    await this.db
      .delete(subscriptions)
      .where(eq(subscriptions.id, id));
  }
}
