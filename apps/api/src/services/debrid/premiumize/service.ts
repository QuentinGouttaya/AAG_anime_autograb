import type { DebridProvider, DebridLinkItem } from '../debrid.service.js';
import { PremiumizeApiError } from './error.js';
import type { PremiumizeConfig, PremiumizeDirectDlResponse } from './types.js';

export class PremiumizeService implements DebridProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: PremiumizeConfig) {
    this.apiKey = config.apiKey;
    // Normalize baseUrl to prevent double slashes if user includes a trailing slash
    this.baseUrl = (config.baseUrl ?? 'https://www.premiumize.me/api').replace(/\/$/, '');
  }

  async getDirectDownloadLink(source: string): Promise<DebridLinkItem[]> {
    // Include apikey in the body, not as a Bearer token
    console.log('🔑 PremiumizeService - API Key loaded:', this.apiKey ? `YES (${this.apiKey.substring(0, 8)}...)` : '❌ NO - API KEY IS UNDEFINED');
    const body = new URLSearchParams({
      src: source,
      apikey: this.apiKey  // <-- Add apikey to body (In the .env)
    });

    const response = await fetch(`${this.baseUrl}/transfer/directdl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    // 1. Handle retryable HTTP errors immediately
    if (response.status === 429 || response.status >= 500) {
      throw new PremiumizeApiError('http_error', `HTTP ${response.status}`, true);
    }

    // 2. Safely parse JSON to avoid unhandled SyntaxErrors on non-JSON responses
    let data: PremiumizeDirectDlResponse;
    try {
      data = (await response.json()) as PremiumizeDirectDlResponse;
    } catch {
      throw new PremiumizeApiError(
        'invalid_json',
        'API returned a non-JSON response',
        false
      );
    }

    // 3. Handle API-level errors or missing content
    if (data.status !== 'success' || !data.content) {
      // Use || instead of ?? to also fallback if the API returns empty strings
      const code = data.code || 'unknown_error';
      const message = data.message || 'directdl failed';

      // Explicitly pass false for retryable to match your test expectations
      throw new PremiumizeApiError(code, message, false);
    }

    return data.content;
  }
}
