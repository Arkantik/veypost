import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../workspaces/workspaces.helpers.js', () => ({
  assertMember: vi.fn(),
}));

import { assertMember } from '../workspaces/workspaces.helpers.js';
import { PostsService } from './posts.service.js';

const mockAssertMember = vi.mocked(assertMember);

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-1',
    workspaceId: 'ws-1',
    authorId: 'user-1',
    content: 'Hello world',
    status: 'draft' as const,
    scheduledAt: null,
    targets: [] as unknown[],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeDb(...resultQueue: unknown[]) {
  let idx = 0;
  const next = () => Promise.resolve(resultQueue[idx++] ?? []);
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'from', 'where', 'leftJoin', 'innerJoin', 'orderBy', 'limit', 'offset', 'set', 'values']) {
    chain[m] = () => chain;
  }
  chain['returning'] = next;
  chain['execute'] = next;
  chain['then'] = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => next().then(res, rej);
  return { select: () => chain, insert: () => chain, update: () => chain, delete: () => chain };
}

const fakePublishingService = { enqueueTarget: vi.fn().mockResolvedValue(undefined) };

describe('PostsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertMember.mockResolvedValue({ id: 'm-1', workspaceId: 'ws-1', userId: 'user-1', role: 'editor', createdAt: '2025-01-01T00:00:00Z' } as any);
  });

  describe('list', () => {
    it('returns posts for the workspace', async () => {
      const posts = [makePost(), makePost({ id: 'post-2' })];
      const result = await new PostsService(makeDb(posts) as any, fakePublishingService as any).list('ws-1', 'user-1');
      expect(result).toEqual(posts);
    });

    it('returns empty array when no posts exist', async () => {
      const result = await new PostsService(makeDb([]) as any, fakePublishingService as any).list('ws-1', 'user-1');
      expect(result).toEqual([]);
    });

    it('filters by status', async () => {
      const posts = [makePost({ status: 'scheduled' })];
      const result = await new PostsService(makeDb(posts) as any, fakePublishingService as any).list('ws-1', 'user-1', 'scheduled');
      expect(result).toEqual(posts);
    });

    it('throws FORBIDDEN when caller is not a member', async () => {
      mockAssertMember.mockRejectedValue(Object.assign(new Error(), { code: 'FORBIDDEN' }));
      await expect(new PostsService(makeDb() as any, fakePublishingService as any).list('ws-1', 'user-1')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('getById', () => {
    it('returns the post with its targets', async () => {
      const post = makePost();
      const targets = [{ id: 't-1', postId: 'post-1', connectedAccountId: 'acc-1', platform: 'bluesky', status: 'draft', error: null, publishedAt: null }];
      const result = await new PostsService(makeDb([post], targets) as any, fakePublishingService as any).getById('post-1', 'ws-1', 'user-1');
      expect(result.id).toBe('post-1');
      expect(result.targets).toHaveLength(1);
    });

    it('throws NOT_FOUND when post does not exist', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).getById('x', 'ws-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when post belongs to a different workspace', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).getById('post-1', 'ws-other', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('create', () => {
    it('creates a draft when scheduledAt is not provided', async () => {
      const created = makePost({ status: 'draft' });
      const result = await new PostsService(makeDb([{ id: 'acc-1' }], [created], [], [created]) as any, fakePublishingService as any).create('user-1', {
        workspaceId: 'ws-1', content: 'Hello', connectedAccountIds: ['acc-1'],
      });
      expect(result.status).toBe('draft');
    });

    it('creates a scheduled post when scheduledAt is provided', async () => {
      const created = makePost({ status: 'scheduled', scheduledAt: '2025-06-01T12:00:00Z' });
      const result = await new PostsService(makeDb([{ id: 'acc-1' }], [created], [], [created]) as any, fakePublishingService as any).create('user-1', {
        workspaceId: 'ws-1', content: 'Hello', connectedAccountIds: ['acc-1'], scheduledAt: '2025-06-01T12:00:00Z',
      });
      expect(result.status).toBe('scheduled');
    });

    it('sets authorId from userId, not client input', async () => {
      const created = makePost({ authorId: 'user-1' });
      const result = await new PostsService(makeDb([{ id: 'acc-1' }], [created], [], [created]) as any, fakePublishingService as any).create('user-1', {
        workspaceId: 'ws-1', content: 'Hello', connectedAccountIds: ['acc-1'],
      });
      expect(result.authorId).toBe('user-1');
    });

    it('throws NOT_FOUND when a connectedAccountId is not in the workspace', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).create('user-1', {
        workspaceId: 'ws-1', content: 'Hello', connectedAccountIds: ['foreign-acc'],
      })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('update', () => {
    it('updates a draft post', async () => {
      const existing = makePost({ status: 'draft' });
      const updated = makePost({ content: 'Updated' });
      const result = await new PostsService(makeDb([existing], [], [updated], [], [updated]) as any, fakePublishingService as any).update('post-1', 'user-1', {
        workspaceId: 'ws-1', content: 'Updated',
      });
      expect(result).toBeDefined();
    });

    it('clearing scheduledAt sets status back to draft', async () => {
      const existing = makePost({ status: 'scheduled', scheduledAt: '2025-01-01T00:00:00Z' });
      const updated = makePost({ status: 'draft', scheduledAt: null });
      const result = await new PostsService(makeDb([existing], [], [updated], [], [updated]) as any, fakePublishingService as any).update('post-1', 'user-1', {
        workspaceId: 'ws-1', scheduledAt: null as any,
      });
      expect(result.status).toBe('draft');
    });

    it('providing scheduledAt sets status to scheduled', async () => {
      const existing = makePost({ status: 'draft' });
      const updated = makePost({ status: 'scheduled', scheduledAt: '2025-06-01T00:00:00Z' });
      const result = await new PostsService(makeDb([existing], [], [updated], [], [updated]) as any, fakePublishingService as any).update('post-1', 'user-1', {
        workspaceId: 'ws-1', scheduledAt: '2025-06-01T00:00:00Z',
      });
      expect(result.status).toBe('scheduled');
    });

    it('throws NOT_FOUND when post does not exist', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).update('x', 'user-1', { workspaceId: 'ws-1' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when post belongs to a different workspace', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).update('post-1', 'user-1', { workspaceId: 'ws-other' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws BAD_REQUEST when post is not mutable', async () => {
      const existing = makePost({ status: 'published' });
      await expect(new PostsService(makeDb([existing]) as any, fakePublishingService as any).update('post-1', 'user-1', { workspaceId: 'ws-1' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('throws NOT_FOUND when a connectedAccountId is not in the workspace', async () => {
      const existing = makePost({ status: 'draft' });
      await expect(new PostsService(makeDb([existing], []) as any, fakePublishingService as any).update('post-1', 'user-1', {
        workspaceId: 'ws-1', connectedAccountIds: ['foreign-acc'],
      })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('remove', () => {
    it('deletes a draft post', async () => {
      const existing = makePost({ status: 'draft' });
      await expect(new PostsService(makeDb([existing], []) as any, fakePublishingService as any).remove('post-1', 'ws-1', 'user-1')).resolves.toBeUndefined();
    });

    it('deletes a scheduled post', async () => {
      const existing = makePost({ status: 'scheduled' });
      await expect(new PostsService(makeDb([existing], []) as any, fakePublishingService as any).remove('post-1', 'ws-1', 'user-1')).resolves.toBeUndefined();
    });

    it('throws NOT_FOUND when post does not exist', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).remove('x', 'ws-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when post belongs to a different workspace', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).remove('post-1', 'ws-other', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws BAD_REQUEST when post is not mutable', async () => {
      const existing = makePost({ status: 'publishing' });
      await expect(new PostsService(makeDb([existing]) as any, fakePublishingService as any).remove('post-1', 'ws-1', 'user-1')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
  });

  describe('duplicate', () => {
    it('copy is always a draft with null scheduledAt', async () => {
      const original = makePost({ status: 'scheduled', scheduledAt: '2025-01-01T00:00:00Z' });
      const copy = makePost({ id: 'post-copy', status: 'draft', scheduledAt: null });
      const result = await new PostsService(makeDb([original], [copy], [], [copy]) as any, fakePublishingService as any).duplicate('post-1', 'ws-1', 'user-1');
      expect(result.status).toBe('draft');
      expect(result.scheduledAt).toBeNull();
    });

    it('copy preserves content and sets authorId from userId', async () => {
      const original = makePost({ content: 'Original', authorId: 'someone-else' });
      const copy = makePost({ id: 'post-copy', content: 'Original', authorId: 'user-1', status: 'draft', scheduledAt: null });
      const result = await new PostsService(makeDb([original], [copy], [], [copy]) as any, fakePublishingService as any).duplicate('post-1', 'ws-1', 'user-1');
      expect(result.content).toBe('Original');
      expect(result.authorId).toBe('user-1');
    });

    it('copy includes the original targets', async () => {
      const original = makePost();
      const copy = makePost({ id: 'post-copy', status: 'draft', scheduledAt: null });
      const existingTargets = [{ connectedAccountId: 'acc-1' }, { connectedAccountId: 'acc-2' }];
      const copyTargets = [
        { id: 't-1', postId: 'post-copy', connectedAccountId: 'acc-1', platform: 'bluesky', status: 'draft', error: null, publishedAt: null },
        { id: 't-2', postId: 'post-copy', connectedAccountId: 'acc-2', platform: 'x', status: 'draft', error: null, publishedAt: null },
      ];
      const result = await new PostsService(makeDb([original], [copy], existingTargets, [], [copy], copyTargets) as any, fakePublishingService as any).duplicate('post-1', 'ws-1', 'user-1');
      expect(result.targets).toHaveLength(2);
      expect(result.targets.map((t: any) => t.connectedAccountId)).toEqual(['acc-1', 'acc-2']);
    });

    it('throws NOT_FOUND when post does not exist', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).duplicate('x', 'ws-1', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('throws NOT_FOUND when post belongs to a different workspace', async () => {
      await expect(new PostsService(makeDb([]) as any, fakePublishingService as any).duplicate('post-1', 'ws-other', 'user-1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
