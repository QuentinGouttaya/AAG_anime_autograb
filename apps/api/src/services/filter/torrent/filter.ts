// src/services/filter/torrent/filter.ts
import { AbstractFilter, applyFilterChain, type FilterHandler } from '../index.js';
import type { Torrent } from '../../torrents/torrent.service.js';

export interface TorrentFilterParams {
  minSeeders: number;
  preferredResolution?: string;
}

class MinSeedersFilter extends AbstractFilter<Torrent> {
  constructor(private readonly minSeeders: number) {
    super();
  }

  protected check(torrent: Torrent): boolean {
    return torrent.seeders >= this.minSeeders;
  }
}

class ResolutionFilter extends AbstractFilter<Torrent> {
  constructor(private readonly resolution: string) {
    super();
  }

  protected check(torrent: Torrent): boolean {
    return torrent.title.toLowerCase().includes(this.resolution.toLowerCase());
  }
}

export function buildTorrentFilterChain(
  params: TorrentFilterParams,
): FilterHandler<Torrent> {
  const head = new MinSeedersFilter(params.minSeeders);
  let current: FilterHandler<Torrent> = head;

  if (params.preferredResolution) {
    const resolution = new ResolutionFilter(params.preferredResolution);
    current.setNext(resolution);
    current = resolution;
  }

  return head;
}

export function filterTorrents(
  torrents: Torrent[],
  params: TorrentFilterParams,
): Torrent[] {
  return applyFilterChain(torrents, () => buildTorrentFilterChain(params));
}
