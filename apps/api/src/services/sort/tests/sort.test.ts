// src/services/sort/tests/sort.test.ts
import { describe, it, expect } from 'vitest';
import { ScoreDescendingSort, AttributeSort } from '../sort.js';

interface Item {
  id: number;
  score?: number;
  episodes: number;
}

const ITEMS: Item[] = [
  { id: 1, score: 0.5, episodes: 12 },
  { id: 2, score: 0.9, episodes: 24 },
  { id: 3, score: 0.1, episodes: 1 },
];

describe('ScoreDescendingSort', () => {
  it('trie par score décroissant', () => {
    const sorter = new ScoreDescendingSort<Item>();
    const sorted = sorter.sort(ITEMS);

    expect(sorted.map((i) => i.id)).toEqual([2, 1, 3]);
  });
});

describe('AttributeSort', () => {
  it('trie par attribut numérique asc', () => {
    const sorter = new AttributeSort<Item, 'episodes'>('episodes', 'asc');
    const sorted = sorter.sort(ITEMS);

    expect(sorted.map((i) => i.id)).toEqual([3, 1, 2]);
  });

  it('trie par attribut numérique desc', () => {
    const sorter = new AttributeSort<Item, 'episodes'>('episodes', 'desc');
    const sorted = sorter.sort(ITEMS);

    expect(sorted.map((i) => i.id)).toEqual([2, 1, 3]);
  });
});
