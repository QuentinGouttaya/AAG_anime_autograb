import type { Episode } from './episode.js';
import type { EpisodeStatus } from './subscription_episode.js';

export type TrackedEpisode = Episode & {
  status: EpisodeStatus;
  grabbedAt: string | null;
};
