import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { createPostSchema, updatePostSchema, listPostsQuerySchema } from '@veypost/shared';
import { PostsService } from './posts.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/session.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

const postIdQuery = z.object({ workspaceId: z.string().min(1) });
const duplicateBody = z.object({ workspaceId: z.string().min(1) });

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(listPostsQuerySchema)) query: { workspaceId: string; status?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.list(query.workspaceId, user.id, query.status);
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(postIdQuery)) query: { workspaceId: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.getById(id, query.workspaceId, user.id);
  }

  @Post()
  @HttpCode(201)
  create(
    @Body(new ZodValidationPipe(createPostSchema)) body: { workspaceId: string; content: string; connectedAccountIds: string[]; scheduledAt?: string; publishNow?: boolean },
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.create(user.id, body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePostSchema)) body: { workspaceId: string; content?: string; connectedAccountIds?: string[]; scheduledAt?: string | null },
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(postIdQuery)) query: { workspaceId: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.remove(id, query.workspaceId, user.id);
  }

  @Post(':id/duplicate')
  @HttpCode(201)
  duplicate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(duplicateBody)) body: { workspaceId: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.postsService.duplicate(id, body.workspaceId, user.id);
  }
}
