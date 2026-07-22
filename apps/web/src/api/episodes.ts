import { apiClient } from './client';
import type { Episode, SubscriptionEpisode } from '../types';

export async function getEpisodes(): Promise<Episode[]> {
  const { data } = await apiClient.get<Episode[]>('/episodes');
  return Array.isArray(data) ? data : [];
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

export interface GrabResult {
  subscriptionEpisode: SubscriptionEpisode;
  torrent: {
    title: string;
    magnet: string;
    size: string;
    seeders: number;
    leechers: number;
  };
  links: { path: string; size: number; link: string }[];
}

export async function grabEpisode(
  subscriptionId: number,
  episodeId: number,
): Promise<GrabResult> {
  const { data } = await apiClient.post<GrabResult>(
    `/subscriptions/${subscriptionId}/episodes/${episodeId}/grab`,
  );
  return data;
}
