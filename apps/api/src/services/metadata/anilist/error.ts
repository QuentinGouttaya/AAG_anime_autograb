export class AnilistApiError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(`AniList API error: ${message}`);
    this.name = 'AnilistApiError';
  }
}
