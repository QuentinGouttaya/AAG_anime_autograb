interface AnilistMediaTitle {
  romaji: string;
  english: string | null;
  native: string;
}

interface AnilistMedia {
  id: number;
  title: AnilistMediaTitle;
  episodes: number | null;
  status: string;
}

interface AnilistGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

export class AnilistApiError extends Error {
  readonly code = 502;
  constructor(message: string) {
    super(`AniList API error: ${message}`);
  }
}

export class AnilistService {
  private async request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (response.status === 429) {
      throw new AnilistApiError('rate limit exceeded');
    }

    const json = (await response.json()) as AnilistGraphQLResponse<T>;

    if (json.errors?.length) {
      throw new AnilistApiError(json.errors[0].message);
    }

    return json.data;
  }

  async searchAnime(title: string): Promise<AnilistMedia[]> {
    const query = `
      query ($search: String!) {
        Page(page: 1, perPage: 5) {
          media(search: $search, type: ANIME) {
            id
            title { romaji english native }
            episodes
            status
          }
        }
      }
    `;

    const data = await this.request<{ Page: { media: AnilistMedia[] } }>(query, { search: title });
    return data.Page.media;
  }

  async getAnimeById(anilistId: number): Promise<AnilistMedia | null> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english native }
          episodes
          status
        }
      }
    `;

    const data = await this.request<{ Media: AnilistMedia | null }>(query, { id: anilistId });
    return data.Media;
  }
}
