import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorKind } from '@veypost/shared';
import { DispatchError } from './platform-dispatcher.js';
import { dispatchFacebook } from './facebook.dispatcher.js';

const base: Parameters<typeof dispatchFacebook>[0] = {
  platform: 'facebook',
  content: 'Hello Facebook',
  accessToken: 'fb-token',
  refreshToken: null,
  platformAccountId: 'page-123',
};

beforeEach(() => { vi.restoreAllMocks(); });

describe('dispatchFacebook', () => {
  it('posts to page feed and returns platformPostId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'page-123_post-456' }),
    }));
    const result = await dispatchFacebook(base);
    expect(result.platformPostId).toBe('page-123_post-456');
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('page-123/feed');
  });

  it('throws RateLimited on 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    }));
    const err = await dispatchFacebook(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.RateLimited);
  });

  it('throws AuthExpired on error code 190', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 190, message: 'Invalid OAuth' } }),
    }));
    const err = await dispatchFacebook(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.AuthExpired);
  });
});
