export interface DebridLinkItem {
  path: string;
  size: number;
  link: string;
}

export interface DebridProvider {
  getDirectDownloadLink(source: string): Promise<DebridLinkItem[]>;
}
