import type { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('series', {
    id: 'id',
    anilist_id: { type: 'integer', notNull: true, unique: true },
    canonical_title: { type: 'text', notNull: true },
  });

  pgm.createType('episode_status', [
    'pending',
    'searching',
    'found',
    'added',
    'ready',
    'failed',
  ]);

  pgm.createTable('subscriptions', {
    id: 'id',
    series_id: {
      type: 'integer',
      notNull: true,
      references: '"series"',
      onDelete: 'CASCADE',
    },
    preferred_fansub: { type: 'text[]', notNull: true, default: pgm.func("'{}'") },
    preferred_resolution: { type: 'text', notNull: true },
    min_seeders: { type: 'integer', notNull: true, default: 0 },
    active: { type: 'boolean', notNull: true, default: true },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('episodes', {
    id: 'id',
    subscription_id: {
      type: 'integer',
      notNull: true,
      references: '"subscriptions"',
      onDelete: 'CASCADE',
    },
    episode_number: { type: 'integer', notNull: true },
    status: {
      type: 'episode_status',
      notNull: true,
      default: 'pending',
    },
  });

  pgm.createIndex('subscriptions', 'series_id');
  pgm.createIndex('episodes', 'subscription_id');
  pgm.addConstraint('episodes', 'episodes_subscription_episode_unique', {
    unique: ['subscription_id', 'episode_number'],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('episodes');
  pgm.dropTable('subscriptions');
  pgm.dropType('episode_status');
  pgm.dropTable('series');
}
