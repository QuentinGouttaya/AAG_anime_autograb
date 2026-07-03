export class EpisodeNotFoundError extends Error {
  readonly code = 404;
  constructor(id: number) {
    super(`Episode not found: ${id}`);
  }
}

export class EpisodeLinkUnavailableError extends Error {
  readonly code = 422;
  constructor(id: number) {
    super(`No downloadable link found for episode: ${id}`);
  }
}
