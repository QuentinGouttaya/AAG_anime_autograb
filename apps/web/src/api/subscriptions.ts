import { apiClient } from './client';
import type { Subscription, CreateSubscriptionInput } from '../types';

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data } = await apiClient.get<Subscription[]>('/subscriptions');
  return data;
}

export async function createSubscription(
  input: CreateSubscriptionInput,
): Promise<Subscription> {
  const { data } = await apiClient.post<Subscription>('/subscriptions', input);
  return data;
}

export async function deleteSubscription(id: number): Promise<void> {
  await apiClient.delete(`/subscriptions/${id}`);
}
