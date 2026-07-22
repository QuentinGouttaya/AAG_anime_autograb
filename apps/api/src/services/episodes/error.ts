export class EpisodeNotFoundError extends Error {
  readonly code = 404;
  constructor(id: number) {
    super(`Episode not found: ${id}`);
  }
}

export class EpisodeLinkUnavailableError extends Error {
  readonly code = 422;
  constructor(id: number, options?: { cause?: unknown }) {
    super(`No downloadable link found for episode: ${id}`, options);
  }
}

export class NoTorrentFoundError extends Error {
  readonly code = 404;
  constructor(query: string, minSeeders: number, resolution: string) {
    super(`No valid torrent for "${query}" (minSeeders: ${minSeeders}, res: ${resolution})`);
  }
}
