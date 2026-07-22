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
    const res = this.resolution.toLowerCase();
    const title = torrent.title.toLowerCase();

    // Handle 1080p variations (FHD, 1920x1080, etc.)
    if (res.includes('1080')) {
      return /1080p|1920x1080|fhd|1080/.test(title);
    }
    // Handle 720p variations
    if (res.includes('720')) {
      return /720p|1280x720|hd|720/.test(title);
    }
    // Handle 4K/2160p variations
    if (res.includes('2160') || res.includes('4k')) {
      return /2160p|4k|uhd|3840x2160/.test(title);
    }

    return title.includes(res);
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
