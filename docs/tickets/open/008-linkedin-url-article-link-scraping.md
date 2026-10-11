---
id: "008"
title: LinkedIn URL/article link scraping
type: feature
status: needs-triage
priority: p2
blocked_by: ["003"]
created: 2026-10-11
closed:
---

## Problem

When a LinkedIn post contains a URL, the Posts API does not scrape the link or generate a preview card. Without an explicit article payload the post publishes as plain text with no thumbnail, title, or description. Shoutrrr handles this by fetching the target page, reading its Open Graph and Twitter card meta tags, and attaching an article content block to the post body.

## Acceptance criteria

- [ ] When the post content contains a URL, the LinkedIn dispatcher fetches that URL and reads its `og:title`, `og:description`, and `og:image` meta tags
- [ ] If valid OG data is found, the dispatch payload includes a `content.article` block with `source`, `title`, `description`, and `thumbnail`
- [ ] If the URL is unreachable or OG data is absent, dispatch continues as a plain text post without failing
- [ ] The URL is not duplicated in `commentary` when used as an article source
- [ ] Typecheck passes

## Notes

Shoutrrr reference: `LinkedInConnector.php` — the OG scraping logic runs before building the post body.
Only the first URL in the post content is used for the article card.
This only applies to the LinkedIn dispatcher (`apps/api/src/publishing/platforms/linkedin.dispatcher.ts`).
