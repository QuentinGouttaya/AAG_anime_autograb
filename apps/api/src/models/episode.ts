export type EpisodeStatus = "pending" | "searching" | "found" | "added" | "ready" | "failed";
export type Episode = {
  id: number;
  subscriptionId: number;
  episodeNumber: number;
  status: EpisodeStatus;
};
