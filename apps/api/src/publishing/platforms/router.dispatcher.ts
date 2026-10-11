import { Injectable } from '@nestjs/common';
import { DispatchError, PlatformDispatcher, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';
import { ErrorKind } from '@veypost/shared';
import { dispatchX } from './x.dispatcher.js';
import { dispatchLinkedIn } from './linkedin.dispatcher.js';
import { dispatchFacebook } from './facebook.dispatcher.js';
import { dispatchInstagram } from './instagram.dispatcher.js';
import { dispatchThreads } from './threads.dispatcher.js';
import { dispatchDiscord } from './discord.dispatcher.js';

@Injectable()
export class RouterPlatformDispatcher extends PlatformDispatcher {
  dispatch(input: DispatchInput): Promise<DispatchResult> {
    switch (input.platform) {
      case 'x': return dispatchX(input);
      case 'linkedin': return dispatchLinkedIn(input);
      case 'facebook': return dispatchFacebook(input);
      case 'instagram': return dispatchInstagram(input);
      case 'threads': return dispatchThreads(input);
      case 'discord': return dispatchDiscord(input);
      case 'bluesky': return Promise.reject(
        new DispatchError(ErrorKind.Unsupported, 'Bluesky publishing is coming soon.'),
      );
    }
  }
}
