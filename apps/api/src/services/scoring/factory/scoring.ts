// src/services/scoring/factory/scoring.ts
import type { Torrent } from '../../torrents/torrent.service.js';
import type { ScoringStrategy } from '../scoring.js';
import { WeightedScoringStrategy, type WeightedScoringParams } from '../weighted/strategy.js';
import { BarycenterScoringStrategy, type SparseVector } from '../barycenter/strategy.js';

// Factory : seul endroit qui connaît les classes concrètes. Les appelants
// (grab, recommandation) ne manipulent que ScoringStrategy<T> — on change
// de stratégie ici sans toucher au pipeline filter → score → sort.
export class ScoringFactory {
  static forTorrents(params: WeightedScoringParams): ScoringStrategy<Torrent> {
    return new WeightedScoringStrategy(params);
  }

  static forBarycenter<T>(
    profile: SparseVector,
    toVector: (item: T) => SparseVector,
  ): ScoringStrategy<T> {
    return new BarycenterScoringStrategy<T>(profile, toVector);
  }
}
