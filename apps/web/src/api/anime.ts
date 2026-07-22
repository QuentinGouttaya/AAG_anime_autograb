import { apiClient } from './client';
import type { PaginatedResponse, Serie } from '../types';

// ── AJOUTÉ : recherche paginée ──
export async function searchAnimes(
  query: string,
  page: number = 1,
  perPage: number = 20,
): Promise<PaginatedResponse<Serie>> {
  const { data } = await apiClient.get<PaginatedResponse<Serie>>(
    '/metadata/search',   // ← était '/search'
    { params: { q: query, page, perPage } },
  );
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
