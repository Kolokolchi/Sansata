# Sansata Security Authorization Model & Access Matrix

**Project**: Sansata Real-Estate Web Application & BFF  
**Target Root**: `d:\Anti-Gravity\Sansata`  
**Classification Mode**: Evidence-Based Authorization Audit (Requirement R1)  
**Verification Date**: 2026-09-18  

---

## 1. Authorization Model Determination: Public Access Architecture

An exhaustive investigation of the repository confirms that the Sansata Shattyq web application implements an **Unauthenticated Public Marketing and Visualization Model**.

### Core Determination: Multi-Role RBAC is NOT_APPLICABLE
The application is intentionally designed without:
- User accounts, registration, login, or password recovery mechanisms.
- Authentication tokens (JWT, Bearer tokens, API keys, OAuth session cookies).
- Role-based authorization levels (e.g. `Admin`, `SalesManager`, `Customer`, `Auditor`).
- Private customer dashboards, payment portals, or administrative management consoles.

All features—including the 3D complex exterior viewer, photogrammetry visualizer, interactive floorplans, apartment filter catalog, and consultation forms—are **public marketing assets** designed to be freely browsed by prospective homebuyers.

---

## 2. Resource Access & Control Matrix

The matrix below delineates each system resource, its intended accessibility level, the active protection mechanisms, and its authorization classification.

| Resource / Action | Method / Interface | Public Access | Authenticated Role Required | Active Security Control & Defense Mechanism | Authorization Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Architectural 3D Visualizer** | WebGL Canvas / React UI | **YES (Allowed)** | None (Unauthenticated) | Read-only static geometry; client WebGL resource disposal on unmount; sandboxed external Luma 3D tour iframe (`allow-scripts allow-same-origin`). | **PUBLIC_CATALOG** |
| **Interactive Masterplan & Floorplans** | SVG / Canvas / React UI | **YES (Allowed)** | None (Unauthenticated) | Read-only static coordinate datasets (`src/data/shattyq.json`); centroid validation; pixel-locked coordinate system; no DOM XSS vectors. | **PUBLIC_CATALOG** |
| **Apartment Search & Filter Catalog** | React SPA UI | **YES (Allowed)** | None (Unauthenticated) | Client-side filtering across public room counts and layouts; sanitization of URL query parameters. | **PUBLIC_CATALOG** |
| **Real-Time Apartment Status Feed** | `GET /api/apartments/status` | **YES (Allowed)** | None (Unauthenticated) | Rate limiting (60 req / 1 min); CORS origin verification; cache stampede guard; status cache scrubs all internal CRM entity IDs, exposing only public lot identifiers. | **PUBLIC_API** |
| **Sales Consultation Form** | `POST /api/leads` | **YES (Allowed)** | None (Unauthenticated) | Rate limiting (3 req / 10 min); 8 KB payload ceiling; prototype pollution defense; Kazakh/Russian phone format normalization; honeypot bot trap; SHA-256 idempotency deduplication. | **PUBLIC_LEAD_CAPTURE** |
| **Apartment Consultation Booking** | `POST /api/booking` | **YES (Allowed)** | None (Unauthenticated) | Rate limiting (3 req / 10 min); 8 KB payload ceiling; BOLA check (rejects booking attempts for sold apartments with 409 Conflict); honeypot bot trap; strict schema allowlist. | **PUBLIC_LEAD_CAPTURE** |
| **Static Build Assets & Chunks** | `GET /assets/*` | **YES (Allowed)** | None (Unauthenticated) | Strict path confinement to `dist/`; dotfile blocking (`403`); stream error listeners (SEC-01); full security headers (CSP, nosniff, DENY, etc.). | **PUBLIC_ASSET** |
| **Local SQLite Database (`apartments.db`)** | Local Filesystem | **NO (Forbidden)** | None (Unwired) | Protected from HTTP serving via `server.fs.deny` in `vite.config.ts` (FE-03) and path jail in `server/index.mjs`. Never accessible via network. | **ISOLATED_DATA** |
| **Local Lead Records (`.local/*.ndjson`)** | Local Filesystem | **NO (Forbidden)** | Process Owner Only | Filesystem mode `0o600` (readable/writable exclusively by server process user); zero public URL routes mapped to `.local/`. | **INTERNAL_PERSISTENCE** |
| **Bitrix24 CRM Webhook & Credentials** | Environment Variables | **NO (Forbidden)** | Process Owner Only | Server-side environment isolation (`BITRIX_WEBHOOK_URL`); zero exposure in public DTOs or Vite client bundle (`npm run security:scan` verified). | **INTERNAL_CREDENTIALS** |
| **Server Administration / Process Control** | OS Terminal / CLI | **NO (Forbidden)** | OS Administrator | Operating system process management (systemd / PM2); zero administrative HTTP endpoints exposed over web interfaces. | **HOST_LEVEL_ADMIN** |

---

## 3. Defense-in-Depth for Unauthenticated Endpoints

Because public lead and booking forms accept unauthenticated submissions by design, defense-in-depth is enforced through rigorous non-authentication controls:

1. **Origin Verification (CORS)**: Cross-origin submissions from arbitrary third-party websites are rejected with `403 Forbidden` (`server/apiRouter.mjs:123`).
2. **Rate Limiting Quotas**: IP-based token buckets limit abusive bot traffic to 3 requests per 10 minutes, returning `429 Too Many Requests` with `Retry-After` headers.
3. **Silent Honeypot Trap**: Automated scripts targeting the invisible `website` field are deceived with synthetic 200 OK responses while their submissions are discarded without persistence or CRM notification.
4. **Broken Object Level Authorization (BOLA) Defense**: Although users do not have identities, object-level business rules prevent booking unavailable or already sold apartments (`409 Conflict`).
5. **Payload Size & Structure Constraints**: 8 KB streaming limits and prototype pollution inspections prevent memory exhaustion and runtime prototype poisoning.

---

## 4. Conclusion & Standards Compliance

Implementing artificial user login flows or role-based access control (RBAC) on a public real-estate presentation website would violate user experience requirements and create unnecessary security overhead. The Sansata application correctly isolates its public marketing surface through perimeter rate limiting, strict input validation, and absolute separation of backend CRM credentials.
