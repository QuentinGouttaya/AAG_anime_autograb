// src/services/recommendation/vectorize.ts
import type { AnimeMetadata } from '../filter/metadata/filter.js';
import type { SparseVector } from '../scoring/barycenter/strategy.js';

// Nombre max de tags retenus par anime : le rank AniList (pertinence 0-100
// du tag pour CET anime) sert UNIQUEMENT à sélectionner les tags les plus
// pertinents — il n'entre pas dans le calcul de similarité.
const MAX_TAGS_PER_ANIME = 8;

// Vecteur creux : une dimension par tag RETENU, poids binaire (1).
// Seules les combinaisons des tags les plus pertinents comptent — le
// cosinus mesure ensuite le recouvrement de ces combinaisons, sans
// pondération par rank.
export function toVector(anime: AnimeMetadata): SparseVector {
  const topTags = [...anime.tags]
    .sort((a, b) => (anime.tagRanks?.[b] ?? 0) - (anime.tagRanks?.[a] ?? 0))
    .slice(0, MAX_TAGS_PER_ANIME);

  const v: SparseVector = new Map();
  for (const tag of topTags) {
    v.set(tag, 1);
  }
  return v;
}
