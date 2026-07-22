// src/services/recommendation/recommendation.service.ts
import type { AnimeMetadata } from '../filter/metadata/filter.js';
import { filterMetadataCandidates } from '../filter/metadata/filter.js';
import { buildBarycenter } from '../scoring/barycenter/strategy.js';
import { ScoringFactory } from '../scoring/factory/scoring.js';
import { scoreItems, type Scored } from '../scoring/scoring.js';
import { ScoreDescendingSort } from '../sort/sort.js';
import { toVector } from './vectorize.js';

export interface RecommendationParams {
  catalog: AnimeMetadata[];
  likedAnilistIds: number[];
  likedItemsOutsideCatalog?: AnimeMetadata[];
  excludedAnilistIds?: Set<number>;
  allowAdult?: boolean;
  limit?: number;
}
// Pipeline identique au grab : filter (chain) → score (strategy via factory)
// → sort (strategy). Le scoring ne s'appuie QUE sur les tags et leurs
// combinaisons — aucun autre attribut (popularité, note...) n'entre dans
// le vecteur ni dans le classement.
export class RecommendationService {
  getRecommendations(params: RecommendationParams): Scored<AnimeMetadata>[] {
    const eligible = filterMetadataCandidates(params.catalog, {
      allowAdult: params.allowAdult ?? false,
      excludedAnilistIds: params.excludedAnilistIds ?? new Set(),
    });

    const limit = params.limit ?? 20;
    const likedFromCatalog = params.catalog.filter((a) => params.likedAnilistIds.includes(a.anilistId));
    const liked = [...likedFromCatalog, ...(params.likedItemsOutsideCatalog ?? [])];
    if (liked.length === 0) {
      // Pas de profil de tags à comparer : ordre neutre (ordre du catalogue)
      return eligible.slice(0, limit).map((a) => ({ ...a, score: 0 }));
    }

    // Profil = barycentre des vecteurs de tags des favoris : les
    // combinaisons de tags aimées (co-occurrences) sont encodées dans
    // la moyenne dimension par dimension.
    const profile = buildBarycenter(liked.map((a) => toVector(a)));
    const strategy = ScoringFactory.forBarycenter<AnimeMetadata>(profile, (a) => toVector(a));

    const scored = scoreItems(eligible, strategy);
    const ranked = new ScoreDescendingSort<Scored<AnimeMetadata>>().sort(scored);

    return ranked.slice(0, limit);
  }
}
