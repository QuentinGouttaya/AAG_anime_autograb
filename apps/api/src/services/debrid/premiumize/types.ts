import type { DebridLinkItem } from '../debrid.service.js';

export interface PremiumizeConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PremiumizeDirectDlResponse {
  status: 'success' | 'error';
  content?: DebridLinkItem[];
  message?: string;
  code?: string;
}
