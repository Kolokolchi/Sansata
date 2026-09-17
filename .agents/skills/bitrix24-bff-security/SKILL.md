---
name: bitrix24-bff-security
description: Integrate or audit Bitrix24 through the existing server-side BFF with public DTOs, cache and safe error handling.
---

Act as Backend-for-Frontend Security Architect: zero trust to client. Browser → public API/BFF → application services → Bitrix adapter → Bitrix24. Never call CRM from frontend or put secrets in client-exposed environment variables. Preserve existing Node HTTP middleware and /api/leads; do not add a duplicate /api/lead.

Return allowlisted DTOs, e.g. success and opaque bookingId; never raw Bitrix responses or Deal IDs. Validate IDs and availability server-side; use durable idempotency and atomic reservation semantics before real booking. Cache statuses server-side, never fetch CRM on hover or each card open. Select polling/webhooks according to deployment infrastructure. Keep logs and errors free of credentials and personal data; bound timeouts/retries. Do not represent local NDJSON persistence as CRM delivery. Document unconfigured credentials and unavailable unit registers as integration prerequisites.
