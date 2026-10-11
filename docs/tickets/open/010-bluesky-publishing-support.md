---
id: "010"
title: Bluesky publishing support
type: feature
status: needs-triage
priority: p3
blocked_by: ["003"]
created: 2026-10-11
closed:
---

## Problem

Bluesky is listed as a supported platform in the product but the dispatcher currently throws "coming soon" for all Bluesky post targets. Users who connect a Bluesky account can create and schedule posts but nothing is ever published.

## Acceptance criteria

- [ ] `dispatchBluesky` publishes a text post via the AT Protocol (`com.atproto.repo.createRecord` with `app.bsky.feed.post` lexicon)
- [ ] The session is authenticated using the stored `accessToken` (accessJwt) and refreshed via `refreshToken` (refreshJwt) when expired
- [ ] Rate limit and auth errors throw a `DispatchError` with the appropriate `ErrorKind`
- [ ] `RouterPlatformDispatcher` routes `bluesky` to the new dispatcher instead of throwing
- [ ] Text posts work end-to-end
- [ ] Typecheck passes

## Notes

Bluesky uses app-password-derived JWTs. `accessToken` = `accessJwt`, `refreshToken` = `refreshJwt`.
Session refresh: `POST https://bsky.social/xrpc/com.atproto.server.refreshSession` with `Authorization: Bearer <refreshJwt>`.
Post creation: `POST https://bsky.social/xrpc/com.atproto.repo.createRecord` with `repo` = the user's DID (stored as `platformAccountId`).
Shoutrrr reference: `BlueskyPublishConnector.php` for the AT Protocol post structure.
No platform credentials in `getEnv()` are needed — auth is entirely per-account JWT.
