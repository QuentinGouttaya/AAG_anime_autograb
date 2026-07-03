export class PremiumizeApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly retryable = false,
  ) {
    super(`Premiumize API error [${code}]: ${message}`);
  }
}
