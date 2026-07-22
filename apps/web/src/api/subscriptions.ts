// apps/web/src/api/subscriptions.ts

import { apiClient } from './client';
import type { CreateSubscriptionInput, SubscriptionWithSerie } from '../types';

export async function getSubscriptions(params?: {
  status?: string;
  resolution?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  genre?: string;         // <-- AJOUTÉ
  animeStatus?: string;   // <-- AJOUTÉ
  format?: string;        // <-- AJOUTÉ
}): Promise<SubscriptionWithSerie[]> {
  const { data } = await apiClient.get<SubscriptionWithSerie[]>('/subscriptions', {
    params
  });
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
