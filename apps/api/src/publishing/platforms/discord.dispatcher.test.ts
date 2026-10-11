import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorKind } from '@veypost/shared';
import { DispatchError } from './platform-dispatcher.js';
import { dispatchDiscord } from './discord.dispatcher.js';

const base: Parameters<typeof dispatchDiscord>[0] = {
  platform: 'discord',
  content: 'Hello Discord',
  accessToken: 'https://discord.com/api/webhooks/123/token-abc',
  refreshToken: null,
  platformAccountId: 'webhook-123',
};

beforeEach(() => { vi.restoreAllMocks(); });

describe('dispatchDiscord', () => {
  it('posts to webhook URL and returns platformPostId', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'msg-999' }),
    }));
    const result = await dispatchDiscord(base);
    expect(result.platformPostId).toBe('msg-999');
    const [url, opts] = (fetch as any).mock.calls[0];
    expect(url).toContain('https://discord.com/api/webhooks/123/token-abc');
    expect(url).toContain('wait=true');
    expect(JSON.parse(opts.body)).toMatchObject({ content: 'Hello Discord' });
  });

  it('throws AuthExpired when accessToken is empty', async () => {
    const err = await dispatchDiscord({ ...base, accessToken: '' }).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.AuthExpired);
  });

  it('throws ServerError on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));
    const err = await dispatchDiscord(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.ServerError);
  });
});
