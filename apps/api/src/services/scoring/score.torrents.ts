// src/services/scoring/score-torrents.ts
import type { Torrent } from '../torrents/torrent.service.js';
import type { TorrentScoringStrategy, ScoredTorrent } from './scoring.strategy.js';

// Une seule responsabilité : appliquer une stratégie à une liste.
// Ne connaît aucune stratégie concrète, ne calcule aucun score lui-même.
export function scoreTorrents(
  torrents: Torrent[],
  strategy: TorrentScoringStrategy,
): ScoredTorrent[] {
  return torrents.map((torrent) => strategy.score(torrent));
}
