// src/services/recommendation/recommendation.service.ts
import type { AnimeMetadata } from '../filter/metadata/filter.js';
import { filterMetadataCandidates } from '../filter/metadata/filter.js';
import { buildBarycenter } from '../scoring/barycenter.strategy.js';
import { ScoringFactory } from '../scoring/scoring.factory.js';
import { scoreItems } from '../scoring/torrent/score.js';
import type { Scored } from '../scoring/scoring.strategy.js';
import { ScoreDescendingSort } from '../sort/sort.js';
import { buildVectorizationContext, toVector } from './vectorize.js';

export interface RecommendationParams {
  catalog: AnimeMetadata[];
  likedAnilistIds: number[];   // favoris localStorage envoyés par le front
  excludedAnilistIds?: Set<number>;
  allowAdult?: boolean;
  limit?: number;
}

// Pipeline identique au grab : filter (chain) → score (strategy via factory)
// → sort (strategy). Seule la stratégie de scoring change (barycentre au lieu
// de weighted) — c'est exactement l'interchangeabilité voulue.
export class RecommendationService {
  getRecommendations(params: RecommendationParams): Scored<AnimeMetadata>[] {
    const eligible = filterMetadataCandidates(params.catalog, {
      allowAdult: params.allowAdult ?? false,
      excludedAnilistIds: params.excludedAnilistIds ?? new Set(),
    });

    const limit = params.limit ?? 20;
    const liked = params.catalog.filter((a) => params.likedAnilistIds.includes(a.anilistId));

    if (liked.length === 0) {
      // Pas de profil : ordre neutre par popularité
      return [...eligible]
        .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
        .slice(0, limit)
        .map((a) => ({ ...a, score: 0 }));
    }

    const ctx = buildVectorizationContext(params.catalog);
    const profile = buildBarycenter(liked.map((a) => toVector(a, ctx)));
    const strategy = ScoringFactory.forBarycenter<AnimeMetadata>(profile, (a) => toVector(a, ctx));

    const scored = scoreItems(eligible, strategy);
    const ranked = new ScoreDescendingSort<Scored<AnimeMetadata>>().sort(scored);

    return ranked.slice(0, limit);
  }
}
