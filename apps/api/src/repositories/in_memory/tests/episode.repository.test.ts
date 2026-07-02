// repositories/in_memory/episode.repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEpisodeRepository } from '../episode.repository.js';
import type { Episode } from '@aag/domain';

describe('InMemoryEpisodeRepository', () => {
  let repo: InMemoryEpisodeRepository;

  beforeEach(() => {
    repo = new InMemoryEpisodeRepository();
  });

  it('auto-generates an id on save', async () => {
    const saved = await repo.save({
      id: 0,
      subscriptionId: 1,
      episodeNumber: 1,
      status: 'pending',
    } as Episode);

    expect(saved.id).toBeGreaterThan(0);
  });

  it('finds episodes by subscriptionId', async () => {
    await repo.save({ id: 0, subscriptionId: 1, episodeNumber: 1, status: 'pending' } as Episode);
    await repo.save({ id: 0, subscriptionId: 2, episodeNumber: 1, status: 'pending' } as Episode);

    const results = await repo.findBySubscriptionId(1);
    expect(results).toHaveLength(1);
  });

  it('finds episodes by status', async () => {
    await repo.save({ id: 0, subscriptionId: 1, episodeNumber: 1, status: 'ready' } as Episode);
    const results = await repo.findByStatus('ready');
    expect(results).toHaveLength(1);
  });
});
