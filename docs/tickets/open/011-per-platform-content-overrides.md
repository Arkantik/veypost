---
id: "011"
title: Per-platform content overrides in the composer
type: feature
status: needs-triage
priority: p2
blocked_by: ["004"]
created: 2026-10-11
closed:
---

## Problem

The composer currently sends the same body text to every selected platform. Different platforms have different tone conventions, character limits, and link-handling behaviour; users need to tweak the copy per network without duplicating the whole post.

## Acceptance criteria

- [ ] Composer shows a shared body by default, used for all platforms
- [ ] User can open a per-platform override panel for any selected platform and write a different body for that target
- [ ] Override indicator (e.g. a badge) shows which platforms have custom text
- [ ] Character count and limit check use the override text when one exists, the shared body otherwise
- [ ] `POST /api/v1/posts` receives per-target content; the API stores it on each `post_target` row and dispatchers use it at publish time
- [ ] Clearing an override falls back to the shared body
- [ ] Typecheck passes

## Notes

Schema change required: add a `content` column to `post_targets` (nullable; null = use the parent post body). Requires a `db:migration` skill run.
