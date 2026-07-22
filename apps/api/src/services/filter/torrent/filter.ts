// src/services/filter/torrent/filter.ts
import { AbstractFilter, applyFilterChain, type FilterHandler } from '../index.js';
import type { Torrent } from '../../torrents/torrent.service.js';

export interface TorrentFilterParams {
  minSeeders: number;
  preferredResolution?: string;
  // Titre attendu (sans le numéro d'épisode) : rejette les résultats dont
  // Nyaa a matché un mot en commun mais qui appartiennent à une autre
  // série (ex: "Naruto" matche "Boruto - Naruto Next Generations", le
  // spin-off contient littéralement le nom de la série mère).
  expectedTitle?: string;
}

class MinSeedersFilter extends AbstractFilter<Torrent> {
  constructor(private readonly minSeeders: number) {
    super();
  }

  protected check(torrent: Torrent): boolean {
    return torrent.seeders >= this.minSeeders;
  }
}

// Vérifie que le titre du torrent commence réellement par le titre
// recherché, une fois le(s) tag(s) de groupe ([SubsPlease], [Erai-raws]...)
// retirés. "contains" laisse passer les spin-offs/dérivés dont le titre
// officiel inclut le nom de la série mère ; "startsWith" ancre le match
// sur la position conventionnelle du titre dans un nom de release fansub.
class TitleAnchorFilter extends AbstractFilter<Torrent> {
  constructor(private readonly expectedTitle: string) {
    super();
  }

  protected check(torrent: Torrent): boolean {
    const withoutGroupTags = torrent.title.replace(/^\s*(\[[^\]]+\]\s*)+/, '').trim();
    return withoutGroupTags.toLowerCase().startsWith(this.expectedTitle.trim().toLowerCase());
  }
}

class ResolutionFilter extends AbstractFilter<Torrent> {
  constructor(private readonly resolution: string) {
    super();
  }

  protected check(torrent: Torrent): boolean {
    const res = this.resolution.toLowerCase();
    const title = torrent.title.toLowerCase();

    if (res.includes('1080')) {
      return /1080p|1920x1080|fhd|1080/.test(title);
    }
    if (res.includes('720')) {
      return /720p|1280x720|hd|720/.test(title);
    }
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

  if (params.expectedTitle) {
    const titleAnchor = new TitleAnchorFilter(params.expectedTitle);
    current.setNext(titleAnchor);
    current = titleAnchor;
  }

  return head;
}

export function filterTorrents(
  torrents: Torrent[],
  params: TorrentFilterParams,
): Torrent[] {
  return applyFilterChain(torrents, () => buildTorrentFilterChain(params));
}
