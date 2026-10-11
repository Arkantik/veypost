---
id: "006"
title: Implement image upload for posts
type: feature
status: needs-triage
priority: p2
blocked_by: ["001"]
created: 2026-10-09
closed:
---

## Problem

Posts currently support text only. Social posts routinely include images; without upload support Veypost is not useful for typical workflows. The platform posting clients (ticket 003) need to attach uploaded media to API calls.

## Acceptance criteria

- [ ] User can attach one or more images to a post in the composer
- [ ] Images are stored server-side before the post is scheduled (not sent raw at publish time)
- [ ] A `post_media` table (or a `media` column on `post_targets`) tracks the stored file reference â€” schema change covers both SQLite and PostgreSQL
- [ ] Files are served from a local path (Docker volume) in dev; an env-based storage adapter allows switching to S3-compatible storage without code changes
- [ ] Accepted types: JPEG, PNG, WebP, GIF; max size enforced server-side
- [ ] User can add alt text per image in the composer
- [ ] Alt text is stored alongside the media reference and passed to platform APIs that support it
- [ ] User can attach a video (MP4, MOV) in the composer; the same storage and dispatch path applies
- [ ] Platform dispatch clients attach the stored image or video when calling the platform API
- [ ] Typecheck passes

## Notes

An in-app image editor is out of scope here.
Storage config (local path or S3 bucket/key) must come from `getEnv()`.
A `db:migration` skill run is required before this ticket can be closed.
