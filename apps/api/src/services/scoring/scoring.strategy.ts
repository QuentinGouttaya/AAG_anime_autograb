
// src/services/scoring/scoring.strategy.ts
import type { Torrent } from '../torrents/torrent.service.js';
import type { HasScore } from '../sort/sort.js';

export type ScoredTorrent = Torrent & HasScore;

export interface TorrentScoringStrategy {
  score(torrent: Torrent): ScoredTorrent;
}
