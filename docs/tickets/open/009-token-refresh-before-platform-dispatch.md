---
id: "009"
title: Token refresh before platform dispatch
type: feature
status: needs-triage
priority: p2
blocked_by: ["003"]
created: 2026-10-11
closed:
---

## Problem

The publishing processor passes the stored access token directly to the dispatcher without checking expiry. If the token has expired, the dispatch fails and BullMQ retries with the same expired token, consuming all retry attempts without ever succeeding. Shoutrrr solves this by refreshing the token before building the dispatch context, and forcing a second refresh on `AuthExpired` before counting the attempt against the retry budget.

## Acceptance criteria

- [ ] Before calling `dispatcher.dispatch()`, the processor checks `connectedAccounts.tokenExpiresAt` and calls `refreshTokenForPlatform` if the token is expired or expires within 60 seconds
- [ ] If `dispatch()` throws a `DispatchError` with `kind === ErrorKind.AuthExpired`, the processor forces one token refresh and retries the dispatch once before marking the target as failed — this retry does not consume a BullMQ attempt
- [ ] On a successful refresh the new `accessToken`, `refreshToken`, and `tokenExpiresAt` are written back to the `connectedAccounts` row before retrying
- [ ] On a failed refresh (`refreshTokenForPlatform` throws), the `connectedAccounts` row is set to a `needs_attention` status and the target is marked failed with a clear error message
- [ ] Platforms that do not use expiring tokens (Discord) skip the refresh check
- [ ] Typecheck passes

## Notes

`refreshTokenForPlatform` is in `apps/api/src/accounts/platforms/token-refresh.ts`.
The processor is `apps/api/src/publishing/publishing.processor.ts`.
Shoutrrr reference: `TokenManager.php` and `PublishPostTarget.php` — the `fresh()` call before building `PublishContext`, and the `onAuthExpired()` retry path.
Single-use refresh tokens (X, Bluesky) must be written to the DB before any other state is updated to survive interruptions.
