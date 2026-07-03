import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NyaaIndexer } from './service.js';

describe('NyaaIndexer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses XML RSS feed into Torrent objects', async () => {
    const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:nyaa="https://nyaa.si/xmlns/nyaa">
        <channel>
          <item>
            <title>[Subs] Anime - 01 [1080p].mkv</title>
            <nyaa:infoHash>abcdef1234567890abcdef1234567890abcdef12</nyaa:infoHash>
            <nyaa:size>1.2 GiB</nyaa:size>
            <nyaa:seeders>42</nyaa:seeders>
            <nyaa:leechers>5</nyaa:leechers>
            <pubDate>Wed, 04 Jul 2026 12:00:00 +0000</pubDate>
          </item>
        </channel>
      </rss>`;

    // Mock fetch to return text (XML)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(mockXml),
    });

    const indexer = new NyaaIndexer();
    const results = await indexer.search('Anime');

    expect(results).toHaveLength(1);
    expect(results[0].title).toContain('Anime');
    expect(results[0].magnet).toContain('abcdef1234567890');
    expect(results[0].seeders).toBe(42);
    expect(results[0].size).toBe('1.2 GiB');
  });
});
