// src/services/tests/premiumize.service.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PremiumizeService, PremiumizeApiError } from '../premiumize.service.js';

describe('PremiumizeService', () => {
  let service: PremiumizeService;

  beforeEach(() => {
    service = new PremiumizeService({ apiKey: 'test-key' });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('sends Authorization Bearer header, not apikey query param', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ status: 'success', content: [] }),
    } as Response);

    await service.getDirectDownloadLink('magnet:xxx');

    const [urlArg, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(urlArg)).not.toContain('apikey=');
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer test-key' });
  });

  it('returns content array with path/size/link on success', async () => {
    const content = [
      { path: 'Folder/ep1.mkv', size: 123456789, link: 'https://cdn/ep1.mkv' },
      { path: 'Folder/ep2.mkv', size: 234567890, link: 'https://cdn/ep2.mkv' },
    ];

    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ status: 'success', content }),
    } as Response);

    const result = await service.getDirectDownloadLink('magnet:xxx');
    expect(result).toEqual(content);
  });

  it('throws PremiumizeApiError with stable error code on failure', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ status: 'error', message: 'Service unreachable', code: 'service_down' }),
    } as Response);

    await expect(service.getDirectDownloadLink('bad-link')).rejects.toMatchObject({
      code: 'service_down',
    });
  });

  it('throws unknown_error when API returns catastrophic failure without code', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: async () => ({ status: 'error' }),
    } as Response);

    await expect(service.getDirectDownloadLink('bad-link')).rejects.toThrow(PremiumizeApiError);
  });
});
