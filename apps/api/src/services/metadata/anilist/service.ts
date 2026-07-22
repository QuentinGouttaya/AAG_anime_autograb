import { MetadataService, PaginatedResult, PageInfo } from '../metadata.service.js';
import { AnilistApiError } from './error.js';
import type { Serie, SerieWithTags } from '../../../models/serie.js';
import type { Episode } from '../../../models/episode.js';
import type { Tag } from '../../../models/tag.js';
import type { Season } from '../../../models/season.js';
import type { AnimeMetadata } from '../../filter/metadata/filter.js';

interface AnilistMediaTitle {
  romaji: string;
  english: string | null;
  native: string;
}

interface AnilistCoverImage {
  large: string;
  medium: string;
  color: string | null;
}

interface AnilistAiringScheduleNode {
  episode: number;
  airingAt: number;
}

interface AnilistTag {
  id: number;
  name: string;
  isAdult: boolean;
}

interface AnilistMedia {
  id: number;
  title: AnilistMediaTitle;
  coverImage: AnilistCoverImage;
  episodes: number | null;
  status: string;
  format: string;
  genres: string[];
  isAdult: boolean;
  tags: AnilistTag[];
}

interface AnilistPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

interface AnilistGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { large medium color }
  episodes
  status
  format
  genres
  isAdult
  tags { id name isAdult }
`;

export class AnilistService implements MetadataService {
  private async AnilistRequest<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 429 || res.status >= 500) {
      throw new AnilistApiError(`HTTP ${res.status}`, true, res.status);
    }
    if (!res.ok) {
      throw new AnilistApiError(`HTTP ${res.status}`, false, res.status);
    }

    const json = (await res.json()) as AnilistGraphQLResponse<T>;
    if (json.errors?.length) {
      throw new AnilistApiError(json.errors[0].message, false);
    }
    return json.data;
  }

  // ── MAPPERS ──

  private toSerie(m: AnilistMedia): Serie {
    return {
      id: 0,
      anilistId: m.id,
      canonicalTitle: m.title.english ?? m.title.romaji,
      romajiTitle: m.title.romaji,
      coverImage: m.coverImage?.large ?? m.coverImage?.medium ?? undefined,
      episodeCount: m.episodes,
      status: m.status,
      format: m.format,
      genres: m.genres,
    };
  }

  private toPageInfo(p: AnilistPageInfo): PageInfo {
    return {
      currentPage: p.currentPage,
      lastPage: p.lastPage,
      total: p.total,
      hasNextPage: p.hasNextPage,
      perPage: p.perPage,
    };
  }

  private toTags(media: AnilistMedia): Tag[] {
    return (media.tags ?? []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      isAdult: tag.isAdult,
    }));
  }

  private toAnimeMetadata(m: AnilistMedia): AnimeMetadata {
    return {
      anilistId: m.id,
      isAdult: m.isAdult,
      episodes: m.episodes ?? 0,
      tags: m.tags.map((t) => t.name),
      genres: m.genres,
    };
  }

  async searchAnime(
    title: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<PaginatedResult<SerieWithTags>> {
    const query = `
      query ($search: String!, $page: Int!, $perPage: Int!) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage perPage }
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;

    const data = await this.AnilistRequest<{
      Page: { media: AnilistMedia[]; pageInfo: AnilistPageInfo };
    }>(query, { search: title, page, perPage });

    return {
      data: data.Page.media.map((m) => ({ ...this.toSerie(m), tags: this.toTags(m) })),
      pageInfo: this.toPageInfo(data.Page.pageInfo),
    };
  }

  async getAnimeById(
    anilistId: number,
  ): Promise<(Serie & { episodes: Episode[]; tags: Tag[] }) | null> {
    const query =
      `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`;

    let data: { Media: AnilistMedia | null };
    try {
      data = await this.AnilistRequest<{ Media: AnilistMedia | null }>(
        query,
        { id: anilistId },
      );
    } catch (error) {
      if (error instanceof AnilistApiError && error.status === 404) {
        return null;
      }
      throw error;
    }

    if (!data.Media) return null;

    const serie = this.toSerie(data.Media);
    const episodes = await this.buildEpisodeList(anilistId, serie.id, serie.episodeCount ?? null);

    return {
      ...serie,
      tags: this.toTags(data.Media),
      episodes,
    };
  }

  // airingSchedule ne couvre fiablement que les diffusions récentes/en cours :
  // pour les vieilles séries terminées (Naruto, Bleach...), AniList n'a
  // souvent aucune entrée par épisode. On construit donc la liste à partir
  // du total `episodes` (toujours fiable), et on n'utilise airingSchedule
  // que pour enrichir la date quand elle existe.
  private async buildEpisodeList(
    anilistId: number,
    serieId: number,
    episodeCount: number | null,
  ): Promise<Episode[]> {
    const airedAtByEpisode = await this.fetchAiringDates(anilistId);

    if (!episodeCount || episodeCount <= 0) {
      return [...airedAtByEpisode.entries()].map(([episodeNumber, airedAt]) => ({
        id: 0,
        serieId,
        episodeNumber,
        airedAt,
      }));
    }

    return Array.from({ length: episodeCount }, (_, i) => {
      const episodeNumber = i + 1;
      return {
        id: 0,
        serieId,
        episodeNumber,
        airedAt: airedAtByEpisode.get(episodeNumber) ?? null,
      };
    });
  }

  private async fetchAiringDates(anilistId: number): Promise<Map<number, Date>> {
    const query = `
      query ($id: Int, $page: Int) {
        Media(id: $id, type: ANIME) {
          airingSchedule(page: $page, perPage: 50) {
            pageInfo { hasNextPage }
            nodes { episode airingAt }
          }
        }
      }
    `;

    let page = 1;
    const dates = new Map<number, Date>();

    while (true) {
      const data = await this.AnilistRequest<{
        Media: {
          airingSchedule: {
            pageInfo: { hasNextPage: boolean };
            nodes: AnilistAiringScheduleNode[];
          };
        };
      }>(query, { id: anilistId, page });

      for (const node of data.Media.airingSchedule.nodes) {
        dates.set(node.episode, new Date(node.airingAt * 1000));
      }

      if (!data.Media.airingSchedule.pageInfo.hasNextPage) break;
      page++;
    }

    return dates;
  }

  async getSeasonAnime(season: Season, year: number): Promise<Serie[]> {
    const query = `
      query ($season: MediaSeason, $year: Int, $page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;

    let page = 1;
    let all: Serie[] = [];
    while (true) {
      const data = await this.AnilistRequest<{
        Page: { media: AnilistMedia[]; pageInfo: { hasNextPage: boolean } };
      }>(query, { season, year, page });

      all = all.concat(data.Page.media.map((m) => this.toSerie(m)));
      if (!data.Page.pageInfo.hasNextPage) break;
      page++;
    }
    return all;
  }

  async getSeasonMetadata(season: Season, year: number): Promise<AnimeMetadata[]> {
    const query = `
      query ($season: MediaSeason, $year: Int, $page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;

    let page = 1;
    const all: AnimeMetadata[] = [];
    while (true) {
      const data = await this.AnilistRequest<{
        Page: { media: AnilistMedia[]; pageInfo: { hasNextPage: boolean } };
      }>(query, { season, year, page });

      all.push(...data.Page.media.map((m) => this.toAnimeMetadata(m)));
      if (!data.Page.pageInfo.hasNextPage) break;
      page++;
    }
    return all;
  }
}
