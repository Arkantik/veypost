import { z } from 'zod';
export * from './auth.schema.js';
export * from './workspace.schema.js';
export * from './billing.schema.js';
import { SocialPlatform, PostStatus } from '../types/index.js';

export const connectDiscordSchema = z.object({
  workspaceId: z.string().min(1),
  webhookUrl: z.string().url(),
});
export type ConnectDiscordInput = z.infer<typeof connectDiscordSchema>;

export const connectBlueskySchema = z.object({
  workspaceId: z.string().min(1),
  handle: z.string().min(1),
  appPassword: z.string().min(1),
});
export type ConnectBlueskyInput = z.infer<typeof connectBlueskySchema>;

export const confirmPagesSchema = z.object({
  selectedIds: z.array(z.string().min(1)).min(1),
});
export type ConfirmPagesInput = z.infer<typeof confirmPagesSchema>;

export const createPostSchema = z.object({
  workspaceId: z.string().min(1),
  content: z.string().min(1).max(10000),
  connectedAccountIds: z.array(z.string().min(1)).min(1),
  scheduledAt: z.iso.datetime().optional(),
  publishNow: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  workspaceId: z.string().min(1),
  content: z.string().min(1).max(10000).optional(),
  connectedAccountIds: z.array(z.string().min(1)).min(1).optional(),
  scheduledAt: z.iso.datetime().nullable().optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const listPostsQuerySchema = z.object({
  workspaceId: z.string().min(1),
  status: z.enum(['draft', 'scheduled', 'publishing', 'published', 'failed']).optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
