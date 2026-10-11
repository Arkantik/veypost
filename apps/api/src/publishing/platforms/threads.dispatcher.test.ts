import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorKind } from '@veypost/shared';
import { DispatchError } from './platform-dispatcher.js';
import { dispatchThreads } from './threads.dispatcher.js';

const base: Parameters<typeof dispatchThreads>[0] = {
  platform: 'threads',
  content: 'Hello Threads',
  accessToken: 'threads-token',
  refreshToken: null,
  platformAccountId: 'threads-user-123',
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
});

afterEach(() => { vi.useRealTimers(); });

describe('dispatchThreads', () => {
  it('creates container then publishes, returns platformPostId', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1', status: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'threads-post-1' }) }),
    );
    const result = await dispatchThreads(base);
    expect(result.platformPostId).toBe('threads-post-1');
    expect((fetch as any).mock.calls).toHaveLength(3);
  });

  it('polls until FINISHED when container is IN_PROGRESS', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'c1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'c1', status: 'IN_PROGRESS' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'c1', status: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'post-1' }) }),
    );
    const promise = dispatchThreads(base);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.platformPostId).toBe('post-1');
  });

  it('throws AuthExpired on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    }));
    const err = await dispatchThreads(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.AuthExpired);
  });

  it('throws RateLimited on 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    }));
    const err = await dispatchThreads(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.RateLimited);
  });
});
