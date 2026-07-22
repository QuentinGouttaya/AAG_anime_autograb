import { XMLParser } from 'fast-xml-parser';
import type { TorrentIndexer, Torrent } from '../torrent.service.js';
import { NyaaIndexerError } from './error.js';
import type { NyaaConfig, NyaaRssFeed, NyaaRssItem } from './types.js';
import { AttributeSort } from '../../sort/sort.js';

export class NyaaIndexer implements TorrentIndexer {
  private readonly baseUrl: string;
  private readonly category: string;
  private readonly filter: string;

  constructor(config: NyaaConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://nyaa.si';
    this.category = config.category ?? '1_2';
    this.filter = config.filter ?? '2';
  }

  async search(query: string): Promise<Torrent[]> {
    const url = `${this.baseUrl}/?page=rss&q=${encodeURIComponent(query)}&c=${this.category}&f=${this.filter}`;
    const res = await fetch(url);

    if (res.status === 429 || res.status >= 500) {
      throw new NyaaIndexerError(`HTTP ${res.status}`, true);
    }
    if (!res.ok) {
      throw new NyaaIndexerError(`HTTP ${res.status}`, false);
    }

    const xml = await res.text();
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(xml) as NyaaRssFeed;

    const rawItems = parsed?.rss?.channel?.item;
    if (!rawItems) return [];

    const items: NyaaRssItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];
    return items.map((item) => this.toResult(item));
  }

  private toResult(item: NyaaRssItem): Torrent {
    return {
      title: item.title,
      magnet: this.toMagnet(item['nyaa:infoHash'], item.title),
      size: item['nyaa:size'],
      seeders: Number(item['nyaa:seeders']),
      leechers: Number(item['nyaa:leechers']),
      publishedAt: new Date(item.pubDate),
    };
  }

  private toMagnet(infoHash: string, title: string): string {
    return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;
  }
}
