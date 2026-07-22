import { apiClient } from './client';
import type { CreateSubscriptionInput, SubscriptionWithSerie } from '../types';

// Updated to accept parameters for backend filtering/sorting
export async function getSubscriptions(params?: {
  status?: string;
  resolution?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
