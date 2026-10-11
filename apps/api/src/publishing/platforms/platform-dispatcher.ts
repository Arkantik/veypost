import { Injectable } from '@nestjs/common';
import type { SocialPlatform, ErrorKind } from '@veypost/shared';

export interface DispatchInput {
  platform: SocialPlatform;
  content: string;
  accessToken: string;
  refreshToken: string | null;
  platformAccountId: string;
  mediaUrls?: string[];
}

export interface DispatchResult {
  platformPostId?: string;
}

export class DispatchError extends Error {
  constructor(
    public readonly kind: ErrorKind,
    message: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'DispatchError';
  }
}

export abstract class PlatformDispatcher {
  abstract dispatch(input: DispatchInput): Promise<DispatchResult>;
}

@Injectable()
export class StubPlatformDispatcher extends PlatformDispatcher {
  async dispatch(input: DispatchInput): Promise<DispatchResult> {
    throw new Error(`Platform dispatcher for ${input.platform} not implemented — see ticket 003`);
  }
}
