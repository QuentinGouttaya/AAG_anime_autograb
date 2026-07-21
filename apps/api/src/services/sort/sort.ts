// src/services/sort/sort.ts
//
import { SortDirection } from '../../models/sort.js';

export interface SortStrategy<T> {
  sort(items: T[]): T[];
}



export interface HasScore {
  score?: number;
}

// Tri par score décroissant (par défaut)
export class ScoreDescendingSort<T extends HasScore> implements SortStrategy<T> {
  sort(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const aScore = a.score ?? 0;
      const bScore = b.score ?? 0;
      return bScore - aScore;
    });
  }
}

// Tri par attribut générique
export class AttributeSort<T, K extends keyof T> implements SortStrategy<T> {
  constructor(
    private readonly key: K,
    private readonly direction: SortDirection = 'asc',
  ) { }

  sort(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const aVal = a[this.key];
      const bVal = b[this.key];

      if (aVal === bVal) return 0;
      const res = aVal < bVal ? -1 : 1;
      return this.direction === 'asc' ? res : -res;
    });
  }
}
