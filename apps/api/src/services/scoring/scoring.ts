// src/services/scoring/scoring.ts
import type { Torrent } from '../torrents/torrent.service.js';
import type { HasScore } from '../sort/sort.js';

export type Scored<T> = T & HasScore;
export type ScoredTorrent = Scored<Torrent>;

// Interface Strategy générique : tout scorer (weighted, barycentre...) la
// respecte, donc le pipeline filter → score → sort ne change jamais selon
// la stratégie active.
export interface ScoringStrategy<T> {
  score(item: T): Scored<T>;
}

// Alias pour le domaine torrent.
export type TorrentScoringStrategy = ScoringStrategy<Torrent>;

// Applicateur : applique une stratégie à une liste, sans connaître les
// stratégies concrètes ni calculer de score lui-même.
export function scoreItems<T>(items: T[], strategy: ScoringStrategy<T>): Scored<T>[] {
  return items.map((item) => strategy.score(item));
}

export function scoreTorrents(
  torrents: Torrent[],
  strategy: TorrentScoringStrategy,
): ScoredTorrent[] {
  return scoreItems(torrents, strategy);
}
