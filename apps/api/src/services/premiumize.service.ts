// services/premiumize.service.ts
interface PremiumizeConfig {
  apiKey: string;
  baseUrl?: string;
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
  code?: string;
}

export class PremiumizeApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(`Premiumize API error [${code}]: ${message}`);
  }
}

export class PremiumizeService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: PremiumizeConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://www.premiumize.me/api';
  }

  private authHeaders() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  async getDirectDownloadLink(magnetOrTorrentUrl: string): Promise<PremiumizeDdlItem[]> {
    const body = new URLSearchParams({ src: magnetOrTorrentUrl });

    const response = await fetch(`${this.baseUrl}/transfer/directdl`, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = (await response.json()) as PremiumizeDirectDlResponse;

    if (data.status !== 'success' || !data.content) {
      throw new PremiumizeApiError(data.code ?? 'unknown_error', data.message ?? 'directdl failed');
    }

    return data.content;
  }
}
