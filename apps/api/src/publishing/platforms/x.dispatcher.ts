import { ErrorKind } from '@veypost/shared';
import { DispatchError, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';

function classifyHttpError(status: number, retryAfter: number | undefined, body?: unknown): DispatchError {
  if (status === 429) return new DispatchError(ErrorKind.RateLimited, `X rate limit hit. Retry after ${retryAfter ?? 60}s.`, retryAfter);
  if (status === 401) return new DispatchError(ErrorKind.AuthExpired, 'X auth failed. Reconnect your account.');
  if (status === 403) {
    const errors = (body as any)?.errors as Array<{ code?: number; message?: string }> | undefined;
    const isDuplicate = errors?.some(e => e.code === 187 || e.message?.toLowerCase().includes('duplicate'));
    if (isDuplicate) return new DispatchError(ErrorKind.DuplicateContent, 'X rejected duplicate content.');
    return new DispatchError(ErrorKind.Validation, 'X rejected the request (403).');
  }
  if (status >= 500) return new DispatchError(ErrorKind.ServerError, `X server error (${status}).`);
  return new DispatchError(ErrorKind.Unknown, `X returned unexpected status ${status}.`);
}

async function uploadMedia(mediaUrl: string, accessToken: string): Promise<string> {
  const imageRes = await fetch(mediaUrl);
  if (!imageRes.ok) throw new DispatchError(ErrorKind.Validation, `Could not fetch media from ${mediaUrl}.`);
  const blob = await imageRes.blob();
  const form = new FormData();
  form.append('media', blob);
  form.append('media_category', 'tweet_image');
  const res = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!res.ok) {
    const ra = Number(res.headers.get('x-rate-limit-reset')) || undefined;
    throw classifyHttpError(res.status, ra);
  }
  const data = await res.json() as { media_id_string: string };
  return data.media_id_string;
}

export async function dispatchX(input: DispatchInput): Promise<DispatchResult> {
  const mediaIds: string[] = [];
  for (const url of input.mediaUrls ?? []) {
    mediaIds.push(await uploadMedia(url, input.accessToken));
  }

  const body: Record<string, unknown> = { text: input.content };
  if (mediaIds.length > 0) body['media'] = { media_ids: mediaIds };

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as { data?: { id: string }; errors?: Array<{ code?: number; message?: string }> };

  if (!res.ok) {
    const ra = res.headers.get('x-rate-limit-reset');
    throw classifyHttpError(res.status, ra ? Number(ra) : undefined, data);
  }
  return { platformPostId: data.data?.id };
}
