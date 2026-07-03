// storage/subscription.repository.ts
import type { Pool } from 'pg';
import type { Subscription } from '@aag/domain';
import type { SubscriptionRepository } from '../subscription.repository.js';

interface SubscriptionRow {
  id: number;
  series_id: number;
  preferred_fansub: string[];
  preferred_resolution: string;
  min_seeders: number;
  active: boolean;
  created_at: Date;
}

function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    seriesId: row.series_id,
    preferredFansub: row.preferred_fansub,
    preferredResolution: row.preferred_resolution,
    minSeeders: row.min_seeders,
    active: row.active,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly pool: Pool) { }

  async findAll(): Promise<Subscription[]> {
    const { rows } = await this.pool.query<SubscriptionRow>(
      'SELECT * FROM subscriptions ORDER BY id',
    );
    return rows.map(toSubscription);
  }

  async findById(id: number): Promise<Subscription | null> {
    const { rows } = await this.pool.query<SubscriptionRow>(
      'SELECT * FROM subscriptions WHERE id = $1',
      [id],
    );
    return rows[0] ? toSubscription(rows[0]) : null;
  }

  async save(subscription: Subscription): Promise<Subscription> {
    if (subscription.id === 0) {
      const { rows } = await this.pool.query<SubscriptionRow>(
        `INSERT INTO subscriptions
           (series_id, preferred_fansub, preferred_resolution, min_seeders, active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          subscription.seriesId,
          subscription.preferredFansub,
          subscription.preferredResolution,
          subscription.minSeeders,
          subscription.active,
        ],
      );
      return toSubscription(rows[0]);
    }

    const { rows } = await this.pool.query<SubscriptionRow>(
      `UPDATE subscriptions
         SET series_id = $1, preferred_fansub = $2, preferred_resolution = $3,
             min_seeders = $4, active = $5
       WHERE id = $6
       RETURNING *`,
      [
        subscription.seriesId,
        subscription.preferredFansub,
        subscription.preferredResolution,
        subscription.minSeeders,
        subscription.active,
        subscription.id,
      ],
    );
    return toSubscription(rows[0]);
  }

  async delete(id: number): Promise<void> {
    await this.pool.query('DELETE FROM subscriptions WHERE id = $1', [id]);
  }
}
