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
  // Numéro d'épisode attendu : rejette les résultats dont le titre matche
  // bien la série mais pas le NUMÉRO précis demandé (aucun filtre ne le
  // vérifiait auparavant — série + résolution correctes ne garantissent
  // pas le bon épisode).
  expectedEpisodeNumber?: number;
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

// Rejette les batchs multi-épisodes (ex: "01 ~ 14", "01-13", "[BATCH]",
// "Complete"). Ces packs cumulent les seeders de tous les épisodes qu'ils
// contiennent et gagnent systématiquement le scoring face à un fichier
// unique — sans ce filtre, on grab le même pack entier peu importe
// l'épisode demandé, jamais le fichier isolé correspondant.
class SingleEpisodeFilter extends AbstractFilter<Torrent> {
  protected check(torrent: Torrent): boolean {
    const title = torrent.title;
    // "~" avec espaces (convention batch la plus courante : "01 ~ 14") et
    // "-" compact sans espaces ("01-14") signalent une plage. Le séparateur
    // standard d'un épisode unique ("Title - 01") a toujours des espaces
    // autour du tiret et un seul nombre après — on ne le matche pas ici.
    const hasEpisodeRange = /\b\d{1,4}\s*~\s*\d{1,4}\b/.test(title) || /\b\d{1,4}-\d{1,4}\b/.test(title);
    const hasBatchWord = /\b(batch|complete|season\s*pack|coffret)\b/i.test(title);
    return !hasEpisodeRange && !hasBatchWord;
  }
}

// Vérifie que le numéro d'épisode extrait du titre correspond exactement
// au numéro demandé. Convention fansub : le numéro suit " - " (ou "E"/"EP")
// et précède directement un tag entre crochets/parenthèses, la fin du
// titre, ou l'extension — jamais collé à "p" (pour ne pas confondre avec
// une résolution comme "1080p").
class EpisodeNumberFilter extends AbstractFilter<Torrent> {
  constructor(private readonly expectedEpisodeNumber: number) {
    super();
  }

  protected check(torrent: Torrent): boolean {
    const match = torrent.title.match(
      /(?:-|[Ee][Pp]?)\s*0*(\d{1,4})(?!\d)(?!\s*p\b)\s*(?=\[|\(|\.|$)/,
    );
    if (!match) return false;
    return Number(match[1]) === this.expectedEpisodeNumber;
  }
}

export function buildTorrentFilterChain(
  params: TorrentFilterParams,
): FilterHandler<Torrent> {
  const head = new MinSeedersFilter(params.minSeeders);
  let current: FilterHandler<Torrent> = head;

  const singleEpisode = new SingleEpisodeFilter();
  current.setNext(singleEpisode);
  current = singleEpisode;

  if (params.expectedEpisodeNumber !== undefined) {
    const episodeNumber = new EpisodeNumberFilter(params.expectedEpisodeNumber);
    current.setNext(episodeNumber);
    current = episodeNumber;
  }

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
