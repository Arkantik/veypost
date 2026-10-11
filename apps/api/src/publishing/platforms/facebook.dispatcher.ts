import { ErrorKind } from '@veypost/shared';
import { DispatchError, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';

const GRAPH = 'https://graph.facebook.com/v21.0';

interface GraphError {
  error?: { code?: number; message?: string };
}

function classifyError(status: number, body: GraphError): DispatchError {
  if (status === 429) return new DispatchError(ErrorKind.RateLimited, 'Facebook rate limit hit.');
  const code = body.error?.code;
  if (status === 401 || code === 190) return new DispatchError(ErrorKind.AuthExpired, 'Facebook auth failed. Reconnect your account.');
  if (status >= 500) return new DispatchError(ErrorKind.ServerError, `Facebook server error (${status}).`);
  const msg = body.error?.message ?? `status ${status}`;
  return new DispatchError(ErrorKind.Unknown, `Facebook error: ${msg}`);
}

export async function dispatchFacebook(input: DispatchInput): Promise<DispatchResult> {
  const params: Record<string, string> = {
    message: input.content,
    access_token: input.accessToken,
  };

  if (input.mediaUrls && input.mediaUrls.length > 0) {
    params['link'] = input.mediaUrls[0];
  }

  const res = await fetch(`${GRAPH}/${input.platformAccountId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json() as { id?: string } & GraphError;

  if (!res.ok) throw classifyError(res.status, data);

  return { platformPostId: data.id };
}
