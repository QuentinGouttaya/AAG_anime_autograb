// subscription-episode.repository.ts (parent level, not storage/)
export type EpisodeStatus = "pending" | "searching" | "found" | "added" | "ready" | "failed";

export interface SubscriptionEpisode {
  subscriptionId: number;
  episodeId: number;
  status: EpisodeStatus;
  grabbedAt: string | null;
}

export interface SubscriptionEpisodeRepository {
  findBySubscriptionId(subscriptionId: number): Promise<SubscriptionEpisode[]>;
  findByStatus(status: EpisodeStatus): Promise<SubscriptionEpisode[]>;
  upsert(entry: SubscriptionEpisode): Promise<SubscriptionEpisode>;
}
