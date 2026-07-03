import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Subscription } from '../../../models/subscription.js';
import type { SubscriptionRepository } from '../../subscription.repository.js';
import { subscriptions } from './schema.js';
import { BaseRepository } from '../base.repository.js';

function toSubscription(row: typeof subscriptions.$inferSelect): Subscription {
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
  extends BaseRepository<typeof subscriptions>
  implements SubscriptionRepository {
  constructor(db: NodePgDatabase) {
    super(db, subscriptions, subscriptions.id);
  }

  async findAll(): Promise<Subscription[]> {
    const rows = await this.db.select().from(subscriptions).orderBy(subscriptions.id);
    return rows.map(toSubscription);
  }

  async findById(id: number): Promise<Subscription | null> {
    const row = await this.findRowById(id);
    return row ? toSubscription(row) : null;
  }

  async findBySeriesId(seriesId: number): Promise<Subscription[]> {
    const rows = await this.findRowsWhere(eq(subscriptions.seriesId, seriesId));
    return rows.map(toSubscription);
  }

  async save(subscription: Subscription): Promise<Subscription> {
    const values = {
      seriesId: subscription.seriesId,
      preferredFansub: subscription.preferredFansub,
      preferredResolution: subscription.preferredResolution,
      minSeeders: subscription.minSeeders,
      active: subscription.active,
    };
    const [row] =
      subscription.id === 0
        ? await this.db.insert(subscriptions).values(values).returning()
        : await this.db.update(subscriptions).set(values).where(eq(subscriptions.id, subscription.id)).returning();
    return toSubscription(row);
  }

  // delete(id) inherited from BaseRepository
}
