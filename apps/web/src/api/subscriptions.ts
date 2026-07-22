// apps/web/src/api/subscriptions.ts
import { apiClient } from './client';
import type { CreateSubscriptionInput, SubscriptionWithSerie } from '../types';

export type SubscriptionSortKey = 'createdAt' | 'title' | 'episodeCount';

export interface SubscriptionQuery {
  search?: string;
  status?: 'active' | 'inactive';
  genre?: string;
  animeStatus?: string;
  format?: string;
  sort?: SubscriptionSortKey;
  direction?: 'asc' | 'desc';
}

export async function getSubscriptions(
  params: SubscriptionQuery = {},
): Promise<SubscriptionWithSerie[]> {
  const { data } = await apiClient.get<SubscriptionWithSerie[]>('/subscriptions', { params });
  return Array.isArray(data) ? data : [];
}

export async function createSubscription(
  input: CreateSubscriptionInput,
): Promise<SubscriptionWithSerie> {
  const { data } = await apiClient.post<SubscriptionWithSerie>('/subscriptions', input);
  return data;
}

export async function deleteSubscription(id: number): Promise<void> {
  await apiClient.delete(`/subscriptions/${id}`);
}
