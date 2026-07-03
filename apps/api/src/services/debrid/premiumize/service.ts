import type { DebridProvider, DebridLinkItem } from '../debrid.service.js';
import { PremiumizeApiError } from './error.js';
import type { PremiumizeConfig, PremiumizeDirectDlResponse } from './types.js';

export class PremiumizeService implements DebridProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: PremiumizeConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://www.premiumize.me/api';
  }

  private authHeaders() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  async getDirectDownloadLink(source: string): Promise<DebridLinkItem[]> {
    const body = new URLSearchParams({ src: source });

    const response = await fetch(`${this.baseUrl}/transfer/directdl`, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (response.status === 429 || response.status >= 500) {
      throw new PremiumizeApiError('http_error', `HTTP ${response.status}`, true);
    }

    const data = (await response.json()) as PremiumizeDirectDlResponse;

    if (data.status !== 'success' || !data.content) {
      throw new PremiumizeApiError(data.code ?? 'unknown_error', data.message ?? 'directdl failed');
    }

    return data.content;
  }
}
