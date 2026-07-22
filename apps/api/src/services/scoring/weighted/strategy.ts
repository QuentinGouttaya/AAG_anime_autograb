// src/services/scoring/weighted.strategy.ts
import type { Torrent } from '../../torrents/torrent.service.js';
import type { TorrentScoringStrategy, ScoredTorrent } from '../scoring.js';

export interface WeightedScoringParams {
  preferredResolution?: string;
}

// Une seule responsabilité : calculer un score seeders + bonus résolution.
// Ouverte à extension (nouvelle stratégie = nouvelle classe), fermée à
// modification (pas de branchement de type/kind à l'intérieur).
export class WeightedScoringStrategy implements TorrentScoringStrategy {
  private static readonly SEEDER_WEIGHT = 1;
  private static readonly RESOLUTION_BONUS = 100;

  constructor(private readonly params: WeightedScoringParams) { }

  score(torrent: Torrent): ScoredTorrent {
    const matchesResolution =
      !!this.params.preferredResolution &&
      torrent.title.toLowerCase().includes(this.params.preferredResolution.toLowerCase());

    const score =
      torrent.seeders * WeightedScoringStrategy.SEEDER_WEIGHT +
      (matchesResolution ? WeightedScoringStrategy.RESOLUTION_BONUS : 0);

    return { ...torrent, score };
  }
}
