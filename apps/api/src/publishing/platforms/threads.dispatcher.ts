import { ErrorKind } from '@veypost/shared';
import { DispatchError, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';

const BASE = 'https://graph.threads.net/v1.0';
const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 6_000;

function classifyHttpError(status: number): DispatchError {
  if (status === 429) return new DispatchError(ErrorKind.RateLimited, 'Threads rate limit hit.');
  if (status === 401 || status === 403) return new DispatchError(ErrorKind.AuthExpired, 'Threads auth failed. Reconnect your account.');
  if (status >= 500) return new DispatchError(ErrorKind.ServerError, `Threads server error (${status}).`);
  return new DispatchError(ErrorKind.Unknown, `Threads returned unexpected status ${status}.`);
}

async function apiPost(path: string, token: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  if (!res.ok) throw classifyHttpError(res.status);
  return res.json() as Promise<Record<string, unknown>>;
}

async function pollContainer(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < MAX_POLLS; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const res = await fetch(`${BASE}/${containerId}?access_token=${token}&fields=status`);
    if (!res.ok) throw classifyHttpError(res.status);
    const data = await res.json() as { status?: string };
    const status = data.status;
    if (status === 'FINISHED' || status === 'PUBLISHED') return;
    if (status === 'IN_PROGRESS') continue;
    throw new DispatchError(ErrorKind.ServerError, `Threads container failed with status: ${status}`);
  }
  throw new DispatchError(ErrorKind.MediaProcessing, 'Threads container not ready after max polls.');
}

export async function dispatchThreads(input: DispatchInput): Promise<DispatchResult> {
  const userId = input.platformAccountId;

  const containerParams: Record<string, string> = {
    media_type: 'TEXT',
    text: input.content,
  };

  if (input.mediaUrls && input.mediaUrls.length === 1) {
    containerParams['media_type'] = 'IMAGE';
    containerParams['image_url'] = input.mediaUrls[0];
  }

  const container = await apiPost(`${userId}/threads`, input.accessToken, containerParams);
  const containerId = container['id'] as string;

  await pollContainer(containerId, input.accessToken);

  const published = await apiPost(`${userId}/threads_publish`, input.accessToken, {
    creation_id: containerId,
  });

  return { platformPostId: published['id'] as string };
}
