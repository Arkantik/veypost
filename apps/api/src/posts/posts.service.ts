import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { sqliteSchema } from '@veypost/db';
import type { DbClient } from '@veypost/db';
import type { PostWithTargets, PostTarget } from '@veypost/shared';
import type { CreatePostInput, UpdatePostInput } from '@veypost/shared';
import { assertMember } from '../workspaces/workspaces.helpers.js';
import { notFound, badRequest } from '../common/app.exception.js';
import { PublishingService } from '../publishing/publishing.service.js';

const { posts, postTargets, connectedAccounts } = sqliteSchema;

const MUTABLE_STATUSES = ['draft', 'scheduled'] as const;

@Injectable()
export class PostsService {
  constructor(
    @Inject('DB') private readonly db: DbClient,
    private readonly publishingService: PublishingService,
  ) {}

  private get q() { return this.db as any; }

  async list(workspaceId: string, userId: string, status?: string): Promise<PostWithTargets[]> {
    await assertMember(this.q, workspaceId, userId);
    const conditions = status
      ? and(eq(posts.workspaceId, workspaceId), eq(posts.status, status as any))
      : eq(posts.workspaceId, workspaceId);
    const rows = await this.q.select().from(posts).where(conditions);
    if (rows.length === 0) return [];
    const postIds = rows.map((r: any) => r.id);
    const targets = await this.q
      .select({
        id: postTargets.id,
        postId: postTargets.postId,
        connectedAccountId: postTargets.connectedAccountId,
        platform: connectedAccounts.platform,
        status: postTargets.status,
        error: postTargets.error,
        publishedAt: postTargets.publishedAt,
      })
      .from(postTargets)
      .innerJoin(connectedAccounts, eq(postTargets.connectedAccountId, connectedAccounts.id))
      .where(inArray(postTargets.postId, postIds));
    return rows.map((r: any) => ({
      ...r,
      targets: targets.filter((t: any) => t.postId === r.id),
    }));
  }

  async getById(id: string, workspaceId: string, userId: string): Promise<PostWithTargets> {
    await assertMember(this.q, workspaceId, userId);
    const [post] = await this.q.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post || post.workspaceId !== workspaceId) throw notFound('Post not found');
    const targets = await this.q
      .select({
        id: postTargets.id,
        postId: postTargets.postId,
        connectedAccountId: postTargets.connectedAccountId,
        platform: connectedAccounts.platform,
        status: postTargets.status,
        error: postTargets.error,
        publishedAt: postTargets.publishedAt,
      })
      .from(postTargets)
      .innerJoin(connectedAccounts, eq(postTargets.connectedAccountId, connectedAccounts.id))
      .where(eq(postTargets.postId, id));
    return { ...post, targets };
  }

  async create(userId: string, input: CreatePostInput): Promise<PostWithTargets> {
    const { workspaceId, content, connectedAccountIds, scheduledAt, publishNow } = input;
    await assertMember(this.q, workspaceId, userId);
    await this.assertAccountsInWorkspace(connectedAccountIds, workspaceId);
    const status = publishNow ? 'publishing' : scheduledAt ? 'scheduled' : 'draft';
    const [post] = await this.q
      .insert(posts)
      .values({ workspaceId, authorId: userId, content, status, scheduledAt: scheduledAt ?? null })
      .returning();
    const inserted: { id: string }[] = await this.q
      .insert(postTargets)
      .values(connectedAccountIds.map((connectedAccountId: string) => ({ postId: post.id, connectedAccountId, status })))
      .returning({ id: postTargets.id });
    if (publishNow) {
      for (const { id } of inserted) {
        await this.publishingService.publishTargetSync(id);
      }
    }
    return this.getById(post.id, workspaceId, userId);
  }

  async update(id: string, userId: string, input: UpdatePostInput): Promise<PostWithTargets> {
    const { workspaceId, content, connectedAccountIds, scheduledAt } = input;
    await assertMember(this.q, workspaceId, userId);
    const [post] = await this.q.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post || post.workspaceId !== workspaceId) throw notFound('Post not found');
    if (!MUTABLE_STATUSES.includes(post.status)) {
      throw badRequest('Only draft or scheduled posts can be updated');
    }
    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (content !== undefined) patch.content = content;
    if (scheduledAt !== undefined) {
      patch.scheduledAt = scheduledAt;
      patch.status = scheduledAt ? 'scheduled' : 'draft';
    }
    await this.q.update(posts).set(patch).where(eq(posts.id, id));
    if (connectedAccountIds !== undefined) {
      await this.assertAccountsInWorkspace(connectedAccountIds, workspaceId);
      await this.q.delete(postTargets).where(eq(postTargets.postId, id));
      await this.q.insert(postTargets).values(
        connectedAccountIds.map((connectedAccountId: string) => ({ postId: id, connectedAccountId })),
      );
    }
    return this.getById(id, workspaceId, userId);
  }

  async remove(id: string, workspaceId: string, userId: string): Promise<void> {
    await assertMember(this.q, workspaceId, userId);
    const [post] = await this.q.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post || post.workspaceId !== workspaceId) throw notFound('Post not found');
    if (!MUTABLE_STATUSES.includes(post.status)) {
      throw badRequest('Only draft or scheduled posts can be deleted');
    }
    await this.q.delete(posts).where(eq(posts.id, id));
  }

  async duplicate(id: string, workspaceId: string, userId: string): Promise<PostWithTargets> {
    await assertMember(this.q, workspaceId, userId);
    const [post] = await this.q.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!post || post.workspaceId !== workspaceId) throw notFound('Post not found');
    const [newPost] = await this.q
      .insert(posts)
      .values({ workspaceId, authorId: userId, content: post.content, status: 'draft', scheduledAt: null })
      .returning();
    const existingTargets = await this.q
      .select({ connectedAccountId: postTargets.connectedAccountId })
      .from(postTargets)
      .where(eq(postTargets.postId, id));
    if (existingTargets.length > 0) {
      await this.q.insert(postTargets).values(
        existingTargets.map((t: any) => ({ postId: newPost.id, connectedAccountId: t.connectedAccountId })),
      );
    }
    return this.getById(newPost.id, workspaceId, userId);
  }

  private async assertAccountsInWorkspace(accountIds: string[], workspaceId: string): Promise<void> {
    const rows = await this.q
      .select({ id: connectedAccounts.id })
      .from(connectedAccounts)
      .where(and(inArray(connectedAccounts.id, accountIds), eq(connectedAccounts.workspaceId, workspaceId)));
    if (rows.length !== accountIds.length) {
      throw notFound('One or more connected accounts not found in this workspace');
    }
  }
}
