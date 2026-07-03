export class AnilistApiError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(`AniList API error: ${message}`);
  }
}
