import { Injectable, Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { sqliteSchema } from '@veypost/db';
import type { DbClient } from '@veypost/db';
import { PUBLISHING_QUEUE, type PublishJobPayload } from './publishing.types.js';
import { PlatformDispatcher } from './platforms/platform-dispatcher.js';
import { PublishingService } from './publishing.service.js';

const { posts, postTargets, connectedAccounts } = sqliteSchema;

@Processor(PUBLISHING_QUEUE)
export class PublishingProcessor extends WorkerHost {
  private readonly logger = new Logger(PublishingProcessor.name);

  constructor(
    @Inject('DB') private readonly db: DbClient,
    private readonly dispatcher: PlatformDispatcher,
    private readonly publishingService: PublishingService,
  ) {
    super();
  }

  async process(job: Job<PublishJobPayload>): Promise<void> {
    const { postTargetId } = job.data;
    const db = this.db as any;

    const [row] = await db
      .select({
        targetId: postTargets.id,
        targetStatus: postTargets.status,
        postId: postTargets.postId,
        content: posts.content,
        platform: connectedAccounts.platform,
        accessToken: connectedAccounts.accessToken,
        refreshToken: connectedAccounts.refreshToken,
        platformAccountId: connectedAccounts.platformAccountId,
      })
      .from(postTargets)
      .innerJoin(posts, eq(postTargets.postId, posts.id))
      .innerJoin(connectedAccounts, eq(postTargets.connectedAccountId, connectedAccounts.id))
      .where(eq(postTargets.id, postTargetId))
      .limit(1);

    if (!row) {
      this.logger.warn(`Target ${postTargetId} not found, skipping`);
      return;
    }

    if (row.targetStatus === 'published') return;

    try {
      const result = await this.dispatcher.dispatch({
        platform: row.platform,
        content: row.content,
        accessToken: row.accessToken,
        refreshToken: row.refreshToken,
        platformAccountId: row.platformAccountId,
      });
      await db.update(postTargets).set({
        status: 'published',
        publishedAt: new Date().toISOString(),
        platformPostId: result.platformPostId ?? null,
        error: null,
      }).where(eq(postTargets.id, postTargetId));
      await this.publishingService.syncPostStatus(row.postId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db.update(postTargets).set({ status: 'failed', error: message })
        .where(eq(postTargets.id, postTargetId));
      await this.publishingService.syncPostStatus(row.postId);
      throw err;
    }
  }
}
