import { apiClient } from './client';
import type { Episode, SubscriptionEpisode } from '../types';

export async function getEpisodes(): Promise<Episode[]> {
  const { data } = await apiClient.get<Episode[]>('/episodes');
  return data;
}

export async function resolveDownloadLink(
  subscriptionId: number,
  episodeId: number,
  magnetOrTorrentUrl: string,
): Promise<SubscriptionEpisode> {
  const { data } = await apiClient.post<SubscriptionEpisode>(
    `/subscriptions/${subscriptionId}/episodes/${episodeId}/resolve-link`,
    { magnetOrTorrentUrl },
  );
  return data;
}
