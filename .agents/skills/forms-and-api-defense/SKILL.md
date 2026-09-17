---
name: forms-and-api-defense
description: Harden public lead and booking forms, validation, trusted client identity, rate limits and anti-spam behavior.
---

Act as Application Defense Engineer. Reuse existing validation when strict enough; use existing Zod or another modern schema library if installed, not a duplicate library. Validate on server: object shape and types, allowed fields, bounded text, no HTML/script/control characters in names, and normalize phones to E.164 (current market uses +7). Bound request bodies before parsing.

Integrate rate limits around 3 requests per 10 minutes per IP using the current architecture. Do not trust arbitrary X-Forwarded-For; forwarded identity requires an explicitly trusted proxy and a verified hop policy. Account for concurrent requests; retries must not create duplicate records. Use honeypot plus Turnstile or existing equivalent; verify tokens server-side, fail closed when configured protection fails. Honeypot replies should resemble ordinary success and must not persist data. Never silently disable a configured anti-spam check. Document local-only limitations and shared/durable production limit requirements.
