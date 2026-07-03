import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PremiumizeService } from './service.js';
import { PremiumizeApiError } from './error.js';

function mockFetchOnce(response: Partial<Response> & { json: () => Promise<unknown> }) {
  global.fetch = vi.fn().mockResolvedValue(response as Response);
}

describe('PremiumizeService', () => {
  const config = { apiKey: 'test-key' };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends correct request shape', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ status: 'success', content: [] }),
    });

    const svc = new PremiumizeService(config);
    await svc.getDirectDownloadLink('magnet:xyz');

    expect(fetch).toHaveBeenCalledWith(
      'https://www.premiumize.me/api/transfer/directdl',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      }),
    );
  });

  it('returns content on success', async () => {
    const content = [{ path: 'ep1.mkv', size: 1234, link: 'https://dl/ep1' }];
    mockFetchOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ status: 'success', content }),
    });

    const svc = new PremiumizeService(config);
    const result = await svc.getDirectDownloadLink('magnet:xyz');

    expect(result).toEqual(content);
  });

  it('respects custom baseUrl', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ status: 'success', content: [] }),
    });

    const svc = new PremiumizeService({ ...config, baseUrl: 'https://custom.api' });
    await svc.getDirectDownloadLink('magnet:xyz');

    expect(fetch).toHaveBeenCalledWith('https://custom.api/transfer/directdl', expect.anything());
  });

  it('throws retryable error on 429', async () => {
    mockFetchOnce({ status: 429, ok: false, json: () => Promise.resolve({}) });

    const svc = new PremiumizeService(config);
    await expect(svc.getDirectDownloadLink('magnet:xyz')).rejects.toMatchObject({
      retryable: true,
      code: 'http_error',
    });
  });

  it('throws retryable error on 5xx', async () => {
    mockFetchOnce({ status: 503, ok: false, json: () => Promise.resolve({}) });

    const svc = new PremiumizeService(config);
    await expect(svc.getDirectDownloadLink('magnet:xyz')).rejects.toBeInstanceOf(PremiumizeApiError);
    await expect(
      new PremiumizeService(config).getDirectDownloadLink('magnet:xyz'),
    ).rejects.toMatchObject({ retryable: true });
  });

  it('throws non-retryable error on API-level failure', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ status: 'error', code: 'invalid_src', message: 'bad magnet' }),
    });

    const svc = new PremiumizeService(config);
    await expect(svc.getDirectDownloadLink('bad-magnet')).rejects.toMatchObject({
      retryable: false,
      code: 'invalid_src',
      message: expect.stringContaining('bad magnet'),
    });
  });

  it('throws with fallback code/message when API omits them', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ status: 'error' }),
    });

    const svc = new PremiumizeService(config);
    await expect(svc.getDirectDownloadLink('bad')).rejects.toMatchObject({
      code: 'unknown_error',
    });
  });

  it('throws when content is missing despite success status', async () => {
    mockFetchOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ status: 'success' }),
    });

    const svc = new PremiumizeService(config);
    await expect(svc.getDirectDownloadLink('x')).rejects.toBeInstanceOf(PremiumizeApiError);
  });
});
