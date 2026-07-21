// src/repositories/in_memory/tests/episode.repository.test.ts
import { describe, expect, it } from 'vitest';

import type { Episode } from '../../../models/episode.js';
import { InMemoryEpisodeRepository } from '../episode.repository.js';

function episode(
  overrides: Partial<Episode> = {},
): Episode {
  return {
    id: 0,
    serieId: 1,
    episodeNumber: 1,
    airedAt: null,
    ...overrides,
  };
}

describe('InMemoryEpisodeRepository', () => {
  it('assigns an id when saving a new episode', async () => {
    const repo = new InMemoryEpisodeRepository();

    const saved = await repo.save(episode());

    expect(saved.id).toBe(1);
  });

  it('finds an episode by id', async () => {
    const repo = new InMemoryEpisodeRepository();

    const saved = await repo.save(episode());

    await expect(repo.findById(saved.id)).resolves.toEqual(saved);
    await expect(repo.findById(999)).resolves.toBeNull();
  });

  it('finds episodes by serie id', async () => {
    const repo = new InMemoryEpisodeRepository();

    await repo.save(episode({ serieId: 1, episodeNumber: 1 }));
    await repo.save(episode({ serieId: 2, episodeNumber: 1 }));
    await repo.save(episode({ serieId: 1, episodeNumber: 2 }));

    const result = await repo.findBySerieId(1);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.episodeNumber)).toEqual([1, 2]);
  });

  it('deletes an episode', async () => {
    const repo = new InMemoryEpisodeRepository();

    const saved = await repo.save(episode());

    await repo.delete(saved.id);

    await expect(repo.findById(saved.id)).resolves.toBeNull();
  });
});
