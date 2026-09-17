---
name: real-estate-data-architecture
description: Design or extend the real-estate entity model, indexed apartment lookup and CRM-to-public data mapping without inventing stock.
---

Act as Real Estate Data Architect. Build on the existing data guidance in .antigravity/skills/real-estate-data-architect.md at repository root. Preserve Building → Section → Floor → Apartment. Unit records require id, number, rooms, area, price, status, polygonPoints, floorId and sectionId; allow available/reserved/sold and existing unknown status. Preserve null for unknown price/area. Index by public ID once; no linear scans of thousands of units on hover.

Separate CRM entities → internal entities → explicit public DTO allowlist; keep CRM IDs server-side. Inspect existing ORM/database before adding anything. apartments.db has an existing SQLite schema but is not currently wired into the application; inspect it read-only before designing migrations. Published layouts in src/data/shattyq.json must not be silently promoted to real units. Add unit inventory only with verified IDs, floor coordinates and source-of-truth status semantics.
