import { ErrorKind } from '@veypost/shared';
import { DispatchError, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';

const GRAPH = 'https://graph.facebook.com/v21.0';
const MAX_POLLS = 20;
const POLL_INTERVAL_MS = 6_000;

function classifyHttpError(status: number): DispatchError {
  if (status === 429) return new DispatchError(ErrorKind.RateLimited, 'Instagram rate limit hit.');
  if (status === 401 || status === 403) return new DispatchError(ErrorKind.AuthExpired, 'Instagram auth failed. Reconnect your account.');
  if (status >= 500) return new DispatchError(ErrorKind.ServerError, `Instagram server error (${status}).`);
  return new DispatchError(ErrorKind.Unknown, `Instagram returned unexpected status ${status}.`);
}

async function apiPost(path: string, token: string, params: Record<string, string>): Promise<unknown> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  if (!res.ok) throw classifyHttpError(res.status);
  return res.json();
}

async function apiGet(path: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${GRAPH}/${path}?access_token=${token}&fields=status_code`);
  if (!res.ok) throw classifyHttpError(res.status);
  return res.json() as Promise<Record<string, unknown>>;
}

async function pollContainer(containerId: string, token: string): Promise<void> {
  for (let i = 0; i < MAX_POLLS; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    const data = await apiGet(containerId, token);
    const status = data['status_code'];
    if (status === 'FINISHED' || status === 'PUBLISHED') return;
    if (status === 'IN_PROGRESS') continue;
    throw new DispatchError(ErrorKind.ServerError, `Instagram container failed with status: ${status}`);
  }
  throw new DispatchError(ErrorKind.MediaProcessing, 'Instagram container not ready after max polls.');
}

export async function dispatchInstagram(input: DispatchInput): Promise<DispatchResult> {
  if (!input.mediaUrls || input.mediaUrls.length === 0) {
    throw new DispatchError(ErrorKind.Validation, 'Instagram requires at least one image. Add a photo before posting to Instagram.');
  }

  const userId = input.platformAccountId;
  let containerId: string;

  if (input.mediaUrls.length === 1) {
    const data = await apiPost(`${userId}/media`, input.accessToken, {
      image_url: input.mediaUrls[0],
      caption: input.content,
    }) as { id: string };
    containerId = data.id;
  } else {
    const childIds: string[] = [];
    for (const url of input.mediaUrls) {
      const child = await apiPost(`${userId}/media`, input.accessToken, {
        image_url: url,
        is_carousel_item: 'true',
      }) as { id: string };
      childIds.push(child.id);
    }
    const carousel = await apiPost(`${userId}/media`, input.accessToken, {
      media_type: 'CAROUSEL',
      caption: input.content,
      children: childIds.join(','),
    }) as { id: string };
    containerId = carousel.id;
  }

  await pollContainer(containerId, input.accessToken);

  const published = await apiPost(`${userId}/media_publish`, input.accessToken, {
    creation_id: containerId,
  }) as { id: string };

  return { platformPostId: published.id };
}
