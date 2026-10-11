import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, lte, inArray, isNotNull } from 'drizzle-orm';
import { sqliteSchema } from '@veypost/db';
import type { DbClient } from '@veypost/db';
import { PublishingService } from './publishing.service.js';

const { posts, postTargets } = sqliteSchema;

@Injectable()
export class PublishingScheduler {
  private readonly logger = new Logger(PublishingScheduler.name);

  constructor(
    @Inject('DB') private readonly db: DbClient,
    private readonly publishingService: PublishingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async enqueueDuePosts(): Promise<void> {
    const db = this.db as any;
    const now = new Date().toISOString();

    const duePosts: { id: string }[] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.status, 'scheduled'), isNotNull(posts.scheduledAt), lte(posts.scheduledAt, now)));

    if (duePosts.length === 0) return;

    const postIds = duePosts.map((p) => p.id);

    const targets: { id: string; postId: string }[] = await db
      .select({ id: postTargets.id, postId: postTargets.postId })
      .from(postTargets)
      .where(and(inArray(postTargets.postId, postIds), eq(postTargets.status, 'scheduled')));

    if (targets.length === 0) return;

    this.logger.log(`Enqueueing ${targets.length} target(s) from ${duePosts.length} post(s)`);

    const succeededPostIds = new Set<string>();
    for (const target of targets) {
      try {
        await this.publishingService.enqueueTarget(target.id);
        succeededPostIds.add(target.postId);
      } catch (err) {
        this.logger.error(`Failed to enqueue target ${target.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    for (const postId of succeededPostIds) {
      await db.update(posts).set({ status: 'publishing', updatedAt: now }).where(eq(posts.id, postId));
    }
  }
}
