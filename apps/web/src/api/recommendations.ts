import { apiClient } from './client';
import { getFavorites } from './favorites';

export interface Recommendation {
  anilistId: number;
  title?: string;
  isAdult: boolean;
  episodes: number;
  tags: string[];
  genres: string[];
  score?: number;
}

export async function getRecommendations(
  season: string,
  year: number,
  limit = 20,
): Promise<Recommendation[]> {
  const liked = getFavorites();
  const { data } = await apiClient.get<Recommendation[]>('/recommendations', {
    params: {
      season,
      year,
      limit,
      liked: liked.length > 0 ? liked.join(',') : undefined,
    },
  });
  return data;
}
