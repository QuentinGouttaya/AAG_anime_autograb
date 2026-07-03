import { describe, it, expect } from 'vitest';
import { AnilistService } from '../services/metadata/anilist/service.js';
import { NyaaIndexer } from '../services/torrents/nyaa/service.js';
import { PremiumizeService } from '../services/debrid/premiumize/service.js';

// Ensure your .env has PREMIUMIZE_API_KEY set!
const PREMIUMIZE_API_KEY = process.env.PREMIUMIZE_API_KEY;

describe('End-to-End Pipeline (Anilist -> Nyaa -> Premiumize)', () => {
  // Frieren: Beyond Journey's End
  const ANILIST_ID = 154587;
  const EPISODE_NUMBER = 1;

  it('resolves a direct download link for Frieren Episode 1', async () => {
    // 1. Initialize Services
    const anilist = new AnilistService();
    const nyaa = new NyaaIndexer();
    const premiumize = new PremiumizeService({ apiKey: PREMIUMIZE_API_KEY! });

    // 2. Fetch Metadata from Anilist
    console.log('🔍 Fetching metadata from Anilist...');
    const anime = await anilist.getAnimeById(ANILIST_ID);
    expect(anime).not.toBeNull();
    expect(anime?.canonicalTitle).toBeDefined();
    console.log(`✅ Found: ${anime?.canonicalTitle}`);

    // 3. Search Nyaa - Use romaji title (what uploaders actually use)
    const searchQuery = `Sousou no Frieren ${EPISODE_NUMBER.toString().padStart(2, '0')}`;
    console.log(`🔍 Searching Nyaa for: "${searchQuery}"...`);

    const torrents = await nyaa.search(searchQuery);
    expect(torrents.length).toBeGreaterThan(0);

    // Pick the torrent with the most seeders
    const bestTorrent = torrents.reduce((prev, current) =>
      (prev.seeders > current.seeders) ? prev : current
    );
    console.log(`✅ Found torrent: ${bestTorrent.title} (${bestTorrent.seeders} seeders)`);

    // 4. Resolve with Premiumize
    console.log(`🔍 Resolving magnet with Premiumize...`);
    const directLinks = await premiumize.getDirectDownloadLink(bestTorrent.magnet);
    console.log(`✅ Premiumize resolved ${directLinks.length} file(s).`);

    if (directLinks.length > 0) {
      console.log(`📥 Direct Link: ${directLinks[0].link}`);
      expect(directLinks[0].link).toContain('http');
    }
  }, 15000); // Give it 15 seconds to run
});
