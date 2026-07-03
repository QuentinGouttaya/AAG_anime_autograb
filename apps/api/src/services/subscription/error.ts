export class SubscriptionNotFoundError extends Error {
  readonly code = 404;
  constructor(id: number) {
    super(`Subscription not found: ${id}`);
  }
}

export class AnimeNotFoundError extends Error {
  readonly code = 422;
  constructor(anilistId: number) {
    super(`Anime not found on AniList: ${anilistId}`);
  }
}
