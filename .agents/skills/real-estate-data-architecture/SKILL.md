---
name: real-estate-data-architecture
description: Design or extend the real-estate entity model, indexed apartment lookup and CRM-to-public data mapping without inventing stock.
---

Act as Real Estate Data Architect. Read docs/architecture-contracts.md and docs/SITE-BASELINE.md. Preserve Building → Section → Floor → Apartment and existing SAF types/indices. Published variants in src/data/saf-plans.json are distinct from observations in src/data/saf-stock-snapshot.json. Preserve public IDs, source date, unknown status and null current prices. Never turn historical stock into live availability or invent units, geometry or prices.

Reuse src/lib/safInventory.ts and src/lib/safSelection.ts. Separate CRM entities → internal entities → explicit public DTO allowlist; keep CRM IDs server-side. There is no runtime SQLite inventory. Add real inventory or migrations only with verified source data and an explicit task. Preserve observation links and all existing apartment facts when extending the model.
