export interface Torrent {
  title: string;
  magnet: string;
  size: string;
  seeders: number;
  leechers: number;
  publishedAt: Date;
}

export interface TorrentIndexer {
  search(query: string): Promise<Torrent[]>;
}
