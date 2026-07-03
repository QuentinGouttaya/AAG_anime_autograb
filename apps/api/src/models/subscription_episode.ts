export type EpisodeStatus = "pending" | "searching" | "found" | "added" | "ready" | "failed";

export type SubscriptionEpisode = {
  subscriptionId: number;
  episodeId: number;
  status: EpisodeStatus;
  grabbedAt: string | null;
};

export type SubscriptionWithEpisodes = Subscription & {
  episodeLinks: TrackedEpisode[]; // aggregated view, not owned nesting
};
