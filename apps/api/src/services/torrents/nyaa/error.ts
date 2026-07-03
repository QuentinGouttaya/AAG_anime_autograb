export class NyaaIndexerError extends Error {
  constructor(
    message: string,
    public readonly retryable = false,
  ) {
    super(`Nyaa indexer error: ${message}`);
  }
}
