import { apiClient } from './client';
import type { CreateSubscriptionInput, SubscriptionWithSerie } from '../types';

export async function getSubscriptions(): Promise<SubscriptionWithSerie[]> {
  const { data } = await apiClient.get<SubscriptionWithSerie[]>('/subscriptions');
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
