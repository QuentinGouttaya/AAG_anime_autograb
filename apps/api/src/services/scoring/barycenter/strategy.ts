// src/services/scoring/barycenter.strategy.ts
import type { ScoringStrategy, Scored } from '../scoring.js';

// Vecteur creux : dimension → poids. Permet un espace de dimensions ouvert
// (une dimension par tag du catalogue, sans plafond arbitraire) là où un
// tableau dense imposerait de figer et tronquer la liste des tags.
export type SparseVector = Map<string, number>;

export function dot(a: SparseVector, b: SparseVector): number {
  // Itère sur le plus petit des deux pour rester O(min(|a|,|b|))
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [dim, weight] of small) {
    const other = large.get(dim);
    if (other !== undefined) sum += weight * other;
  }
  return sum;
}

export function magnitude(a: SparseVector): number {
  let sum = 0;
  for (const weight of a.values()) sum += weight * weight;
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  const denom = magnitude(a) * magnitude(b);
  return denom === 0 ? 0 : dot(a, b) / denom;
}

// Profil utilisateur = barycentre (moyenne dimension par dimension) des
// vecteurs des éléments aimés. Les combinaisons de tags des favoris se
// retrouvent naturellement encodées : un tag présent dans tous les favoris
// pèse 1×rank moyen, un tag présent dans un seul pèse 1/K.
export function buildBarycenter(vectors: SparseVector[]): SparseVector {
  const sum: SparseVector = new Map();
  if (vectors.length === 0) return sum;

  for (const vector of vectors) {
    for (const [dim, weight] of vector) {
      sum.set(dim, (sum.get(dim) ?? 0) + weight);
    }
  }
  for (const [dim, total] of sum) {
    sum.set(dim, total / vectors.length);
  }
  return sum;
}

// Score = similarité cosinus entre le vecteur de l'item et le barycentre.
// Implémente la même interface ScoringStrategy que WeightedScoringStrategy :
// interchangeables via la ScoringFactory, aucun appelant ne connaît la
// classe concrète.
export class BarycenterScoringStrategy<T> implements ScoringStrategy<T> {
  constructor(
    private readonly profile: SparseVector,
    private readonly toVector: (item: T) => SparseVector,
  ) { }

  score(item: T): Scored<T> {
    const similarity = cosineSimilarity(this.profile, this.toVector(item));
    return { ...item, score: Math.round(similarity * 1000) / 1000 };
  }
}
