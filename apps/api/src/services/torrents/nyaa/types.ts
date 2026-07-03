export interface NyaaConfig {
  baseUrl?: string;
  category?: string; // e.g. '1_2' for Anime - English-translated
  filter?: '0' | '1' | '2'; // no filter, no remakes, trusted only
}

export interface NyaaRssItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  'nyaa:seeders': string;
  'nyaa:leechers': string;
  'nyaa:size': string;
  'nyaa:infoHash': string;
  'nyaa:category': string;
}

export interface NyaaRssFeed {
  rss?: {
    channel?: {
      item?: NyaaRssItem | NyaaRssItem[];
    };
  };
}
