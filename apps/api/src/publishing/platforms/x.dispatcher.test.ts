import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorKind } from '@veypost/shared';
import { DispatchError } from './platform-dispatcher.js';
import { dispatchX } from './x.dispatcher.js';

const base: Parameters<typeof dispatchX>[0] = {
  platform: 'x',
  content: 'Hello world',
  accessToken: 'token-123',
  refreshToken: null,
  platformAccountId: 'user-123',
};

beforeEach(() => { vi.restoreAllMocks(); });

describe('dispatchX', () => {
  it('posts text and returns platformPostId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'tweet-abc' } }),
    }));
    const result = await dispatchX(base);
    expect(result.platformPostId).toBe('tweet-abc');
    const [url, opts] = (fetch as any).mock.calls[0];
    expect(url).toBe('https://api.twitter.com/2/tweets');
    expect(JSON.parse(opts.body)).toMatchObject({ text: 'Hello world' });
    expect(opts.headers['Authorization']).toBe('Bearer token-123');
  });

  it('throws RateLimited on 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => '60' },
      json: async () => ({}),
    }));
    const err = await dispatchX(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.RateLimited);
    expect((err as DispatchError).retryAfter).toBe(60);
  });

  it('throws AuthExpired on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
      json: async () => ({}),
    }));
    const err = await dispatchX(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.AuthExpired);
  });

  it('throws DuplicateContent on 403 with error code 187', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: { get: () => null },
      json: async () => ({ errors: [{ code: 187, message: 'Status is a duplicate.' }] }),
    }));
    const err = await dispatchX(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.DuplicateContent);
  });
});
