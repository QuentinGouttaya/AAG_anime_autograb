// services/premiumize.service.ts

interface PremiumizeConfig {
  apiKey: string;
  baseUrl?: string; // défaut: https://www.premiumize.me/api
}

interface PremiumizeDdlItem {
  path: string;
  size: number;
  link: string;
}

interface PremiumizeDirectDlResponse {
  status: 'success' | 'error';
  content?: PremiumizeDdlItem[];
  message?: string;
}

export class PremiumizeService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: PremiumizeConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://www.premiumize.me/api';
  }

  async getDirectDownloadLink(magnetOrTorrentUrl: string): Promise<PremiumizeDdlItem[]> {
    const url = new URL(`${this.baseUrl}/transfer/directdl`);
    url.searchParams.set('apikey', this.apiKey);

    const body = new URLSearchParams({ src: magnetOrTorrentUrl });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = (await response.json()) as PremiumizeDirectDlResponse;

    if (data.status !== 'success' || !data.content) {
      throw new Error(data.message ?? 'Premiumize directdl failed');
    }

    return data.content;
  }
}
