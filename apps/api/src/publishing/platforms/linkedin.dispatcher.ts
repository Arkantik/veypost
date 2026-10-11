import { ErrorKind } from '@veypost/shared';
import { DispatchError, type DispatchInput, type DispatchResult } from './platform-dispatcher.js';

const API_VERSION = '202605';

// LinkedIn's Little Text Format: unescaped `(` silently truncates the post.
function escapeLtf(text: string): string {
  return text.replace(/[\\|{}\[\]()<>@#]/g, c => `\\${c}`);
}

function classifyHttpError(status: number, retryAfter?: number | null): DispatchError {
  if (status === 429) return new DispatchError(ErrorKind.RateLimited, `LinkedIn rate limit hit.`, retryAfter ?? undefined);
  if (status === 401 || status === 403) return new DispatchError(ErrorKind.AuthExpired, 'LinkedIn auth failed. Reconnect your account.');
  if (status >= 500) return new DispatchError(ErrorKind.ServerError, `LinkedIn server error (${status}).`);
  return new DispatchError(ErrorKind.Unknown, `LinkedIn returned unexpected status ${status}.`);
}

async function uploadImage(imageUrl: string, accessToken: string, platformAccountId: string): Promise<string> {
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:person:${platformAccountId}` } }),
  });
  if (!initRes.ok) throw classifyHttpError(initRes.status);
  const { value } = await initRes.json() as { value: { uploadUrl: string; image: string } };

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new DispatchError(ErrorKind.Validation, `Could not fetch media from ${imageUrl}.`);
  const blob = await imgRes.blob();

  const uploadRes = await fetch(value.uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: blob,
  });
  if (!uploadRes.ok) throw classifyHttpError(uploadRes.status);
  return value.image;
}

export async function dispatchLinkedIn(input: DispatchInput): Promise<DispatchResult> {
  const author = `urn:li:person:${input.platformAccountId}`;
  const commentary = escapeLtf(input.content);

  const body: Record<string, unknown> = {
    author,
    commentary,
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  if (input.mediaUrls && input.mediaUrls.length > 0) {
    const imageUrns = await Promise.all(input.mediaUrls.map(u => uploadImage(u, input.accessToken, input.platformAccountId)));
    body['content'] = {
      multiImage: {
        images: imageUrns.map(urn => ({ id: urn, altText: '' })),
      },
    };
  }

  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const ra = res.headers.get('retry-after');
    throw classifyHttpError(res.status, ra ? Number(ra) : null);
  }

  const postId = res.headers.get('location') ?? undefined;
  return { platformPostId: postId };
}
