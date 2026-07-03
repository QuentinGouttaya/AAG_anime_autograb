// repositories/in_memory/subscription.repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemorySubscriptionRepository } from '../subscription.repository.js';
import type { Subscription } from '@aag/domain';

describe('InMemorySubscriptionRepository', () => {
  let repo: InMemorySubscriptionRepository;

  beforeEach(() => {
    repo = new InMemorySubscriptionRepository();
  });

  it('saves and auto-generates an id', async () => {
    const input = {
      id: 0,
      seriesId: 1,
      preferredFansub: ['SubsPlease'],
      preferredResolution: '1080p',
      minSeeders: 5,
      active: true,
      createdAt: new Date().toISOString(),
    } as Subscription;

    const saved = await repo.save(input);
    expect(saved.id).toBeGreaterThan(0);
  });

  it('finds by id after save', async () => {
    const saved = await repo.save({ id: 0, seriesId: 1, preferredFansub: [], preferredResolution: '720p', minSeeders: 1, active: true, createdAt: new Date().toISOString() } as Subscription);
    const found = await repo.findById(saved.id);
    expect(found).toEqual(saved);
  });

  it('deletes an item', async () => {
    const saved = await repo.save({ id: 0, seriesId: 1, preferredFansub: [], preferredResolution: '720p', minSeeders: 1, active: true, createdAt: new Date().toISOString() } as Subscription);
    await repo.delete(saved.id);
    const found = await repo.findById(saved.id);
    expect(found).toBeNull();
  });
});
