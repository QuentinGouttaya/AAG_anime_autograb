import { apiClient } from './client';
import type { Anime } from '../types';

export async function getAnimes(): Promise<Anime[]> {
  const { data } = await apiClient.get<Anime[]>('/animes');
  return data;
}

export async function getAnimeById(id: string | number): Promise<Anime> {
  const { data } = await apiClient.get<Anime>(`/animes/${id}`);
  return data;
}

