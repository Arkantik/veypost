import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorKind } from '@veypost/shared';
import { DispatchError } from './platform-dispatcher.js';
import { dispatchInstagram } from './instagram.dispatcher.js';

const base: Parameters<typeof dispatchInstagram>[0] = {
  platform: 'instagram',
  content: 'Hello Instagram',
  accessToken: 'ig-token',
  refreshToken: null,
  platformAccountId: 'ig-user-123',
  mediaUrls: ['https://example.com/photo.jpg'],
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
});

afterEach(() => { vi.useRealTimers(); });

describe('dispatchInstagram', () => {
  it('creates container then publishes, returns platformPostId', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1', status_code: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'published-post-1' }) }),
    );
    const result = await dispatchInstagram(base);
    expect(result.platformPostId).toBe('published-post-1');
    expect((fetch as any).mock.calls).toHaveLength(3);
  });

  it('throws Validation for text-only (no mediaUrls)', async () => {
    const err = await dispatchInstagram({ ...base, mediaUrls: [] }).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.Validation);
  });

  it('polls until FINISHED when container is IN_PROGRESS', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1', status_code: 'IN_PROGRESS' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1', status_code: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'published-1' }) }),
    );
    const promise = dispatchInstagram(base);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.platformPostId).toBe('published-1');
  });

  it('throws AuthExpired on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));
    const err = await dispatchInstagram(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.AuthExpired);
  });
});
