import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorKind } from '@veypost/shared';
import { DispatchError } from './platform-dispatcher.js';
import { dispatchLinkedIn } from './linkedin.dispatcher.js';

const base: Parameters<typeof dispatchLinkedIn>[0] = {
  platform: 'linkedin',
  content: 'Hello LinkedIn',
  accessToken: 'li-token',
  refreshToken: null,
  platformAccountId: 'person-abc',
};

beforeEach(() => { vi.restoreAllMocks(); });

describe('dispatchLinkedIn', () => {
  it('posts text and returns platformPostId from Location header', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => h === 'location' ? 'urn:li:share:123' : null },
      json: async () => ({}),
    }));
    const result = await dispatchLinkedIn(base);
    expect(result.platformPostId).toBe('urn:li:share:123');
    const [, opts] = (fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.author).toBe('urn:li:person:person-abc');
  });

  it('uses platformAccountId as owner in image upload initializeUpload', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: { uploadUrl: 'https://upload.li/1', image: 'urn:li:image:1' } }) })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(0), blob: async () => new Blob() })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'urn:li:share:1' }, json: async () => ({}) }),
    );
    await dispatchLinkedIn({ ...base, mediaUrls: ['https://example.com/img.jpg'] });
    const [, initOpts] = (fetch as any).mock.calls[0];
    const initBody = JSON.parse(initOpts.body);
    expect(initBody.initializeUploadRequest.owner).toBe('urn:li:person:person-abc');
  });

  it('escapes LTF special characters in content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'urn:li:share:1' },
      json: async () => ({}),
    }));
    await dispatchLinkedIn({ ...base, content: 'Check this (link)' });
    const [, opts] = (fetch as any).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.commentary).toContain('\\(');
  });

  it('throws RateLimited on 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (h: string) => h === 'retry-after' ? '30' : null },
      json: async () => ({}),
    }));
    const err = await dispatchLinkedIn(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.RateLimited);
  });

  it('throws AuthExpired on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => null },
      json: async () => ({}),
    }));
    const err = await dispatchLinkedIn(base).catch(e => e);
    expect(err).toBeInstanceOf(DispatchError);
    expect((err as DispatchError).kind).toBe(ErrorKind.AuthExpired);
  });
});
