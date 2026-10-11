import { ErrorKind } from '@veypost/shared';
import { DispatchError, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';

export async function dispatchDiscord(input: DispatchInput): Promise<DispatchResult> {
  if (!input.accessToken) {
    throw new DispatchError(ErrorKind.AuthExpired, 'Discord webhook URL missing. Reconnect your account.');
  }

  const url = `${input.accessToken}?wait=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: input.content }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new DispatchError(ErrorKind.RateLimited, 'Discord rate limit hit.');
    if (res.status === 401 || res.status === 403) throw new DispatchError(ErrorKind.AuthExpired, 'Discord webhook invalid. Reconnect your account.');
    throw new DispatchError(ErrorKind.ServerError, `Discord returned status ${res.status}.`);
  }

  const data = await res.json() as { id?: string };
  return { platformPostId: data.id };
}
