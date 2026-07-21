import { MetadataService } from "../metadata.service.js";
import { AnilistApiError } from './error.js';
import type { Serie } from '../../../models/serie.js';
import type { Episode } from '../../../models/episode.js';
import type { Tag } from '../../../models/tag.js';
import type { Season } from '../../../models/season.js';

interface AnilistMediaTitle {
  romaji: string;
  english: string | null;
  native: string;
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
  episodes: number | null;
  tags: AnilistTag[];
  airingSchedule: { nodes: AnilistAiringScheduleNode[] };
}
interface AnilistGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';
const MEDIA_FIELDS = `
  id
  title { romaji english native }
  episodes
  tags { id name isAdult }
  airingSchedule(perPage: 50) { nodes { episode airingAt } }
`;

export class AnilistService implements MetadataService {
  private async AnilistRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429 || res.status >= 500) throw new AnilistApiError(`HTTP ${res.status}`, true);
    if (!res.ok) throw new AnilistApiError(`HTTP ${res.status}`, false);
    const json = (await res.json()) as AnilistGraphQLResponse<T>;
    if (json.errors?.length) throw new AnilistApiError(json.errors[0].message, false);
    return json.data;
  }

  private toSerie(m: AnilistMedia): Serie {
    return { id: 0, anilistId: m.id, canonicalTitle: m.title.english ?? m.title.romaji };
  }

  private toTags(m: AnilistMedia): Tag[] {
    return m.tags.map((t) => ({ id: t.id, name: t.name, isAdult: t.isAdult }));
  }

  async searchAnime(title: string): Promise<Serie[]> {
    const query = `
      query ($search: String!) {
        Page(page: 1, perPage: 5) {
          media(search: $search, type: ANIME) { ${MEDIA_FIELDS} }
        }
      }
    `;
    const data = await this.AnilistRequest<{ Page: { media: AnilistMedia[] } }>(query, { search: title });
    return data.Page.media.map((m) => this.toSerie(m));
  }

  async getAnimeById(anilistId: number): Promise<(Serie & { episodes: Episode[]; tags: Tag[] }) | null> {
    const query = `query ($id: Int) { Media(id: $id, type: ANIME) { ${MEDIA_FIELDS} } }`;
    const data = await this.AnilistRequest<{ Media: AnilistMedia | null }>(query, { id: anilistId });
    if (!data.Media) return null;
    const serie = this.toSerie(data.Media);
    const episodes: Episode[] = data.Media.airingSchedule.nodes.map((n) => ({
      id: 0,
      serieId: serie.id,
      episodeNumber: n.episode,
      airedAt: new Date(n.airingAt * 1000),
    }));
    return { ...serie, tags: this.toTags(data.Media), episodes };
  }

  async getSeasonAnime(season: Season, year: number): Promise<Serie[]> {
    const query = `
      query ($season: MediaSeason, $year: Int, $page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) { ${MEDIA_FIELDS} }
        }
      }
    `;
    let page = 1;
    let all: Serie[] = [];
    while (true) {
      const data = await this.AnilistRequest<{ Page: { media: AnilistMedia[]; pageInfo: { hasNextPage: boolean } } }>(
        query, { season, year, page }
      );
      all = all.concat(data.Page.media.map((m) => this.toSerie(m)));
      if (!data.Page.pageInfo.hasNextPage) break;
      page++;
    }
    return all;
  }
}
