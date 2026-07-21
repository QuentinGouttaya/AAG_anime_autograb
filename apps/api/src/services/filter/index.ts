// services/filter/index.ts
// CHAIN OF RESPONSIBILITY

export interface FilterHandler<T> {
  setNext(handler: FilterHandler<T>): FilterHandler<T>;
  handle(item: T): boolean; // true = garder, false = rejeter
}

export abstract class AbstractFilter<T> implements FilterHandler<T> {
  protected next: FilterHandler<T> | null = null;

  setNext(handler: FilterHandler<T>): FilterHandler<T> {
    this.next = handler;
    return handler;
  }

  handle(item: T): boolean {
    if (!this.check(item)) return false;
    return this.next ? this.next.handle(item) : true;
  }

  protected abstract check(item: T): boolean;
}

// Petit helper générique pour appliquer une chaîne sur une liste
export function applyFilterChain<T>(
  items: T[],
  buildChain: () => FilterHandler<T>
): T[] {
  const chain = buildChain();
  return items.filter((i) => chain.handle(i));
}
