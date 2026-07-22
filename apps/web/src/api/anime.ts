import { apiClient } from './client';
import type { PaginatedResponse, Serie } from '../types';

export async function searchAnimes(
  query: string,
  page: number = 1,
  perPage: number = 20,
  tags: string[] = [],
  tagMode: 'any' | 'all' = 'all',
): Promise<PaginatedResponse<Serie>> {
  const { data } = await apiClient.get<PaginatedResponse<Serie>>('/metadata/search', {
    params: {
      q: query,
      page,
      perPage,
      tags: tags.length > 0 ? tags.join(',') : undefined,
      tagMode: tags.length > 0 ? tagMode : undefined,
    },
  });
  return data;
}

export async function getAnimes(): Promise<Serie[]> {
  const { data } = await apiClient.get<Serie[]>('/animes');
  return data;
}

export async function getAnimeById(id: string | number): Promise<Serie> {
  const { data } = await apiClient.get<Serie>(`/animes/${id}`);
  return data;
}
