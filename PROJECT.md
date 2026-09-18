# Project: Sansata Security Audit & Autonomous Remediation (Run 3)

## Architecture
- Stack: Node.js native HTTP server (`node:http`), React 18, Vite 6, Three.js, local NDJSON lead storage, Bitrix24 REST API adapter.
- Trust Boundaries:
  1. Client Browser (Untrusted): React 18, Three.js canvas viewers, LeadForm.
  2. Perimeter Guard (Node HTTP / API Router): Port 8080 (prod) / Vite middleware (dev), body limits (8 KB), CORS origin check, rate limiting, prototype pollution guard.
  3. Application Service (Trusted BFF): `server/leads.mjs`, `server/statusCache.mjs`, local NDJSON storage (`0o600`).
  4. Internal Adapter (BitrixAdapter Boundary): `server/bitrixAdapter.mjs`, SSRF protection, URL scheme enforcement, cloud metadata blocking.
  5. External CRM: Bitrix24 REST API webhook.

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | Server Stream Error Resilience (SEC-01) | Add `.on('error')` handling to `createReadStream().pipe(res)` in `server/index.mjs` | M1 | DONE | Explorer 1 |
| 2 | Content-Security-Policy Header (SEC-02) | Add restrictive CSP header to `server/index.mjs` | M1 | DONE | Explorer 1 |
| 3 | Idempotency Map Capacity Bound (SEC-03) | Enforce 10,000 max capacity with FIFO eviction on `receivedRequests` in `server/apiRouter.mjs` | M1 | DONE | Explorer 1 |
| 4 | Safe URI Decoding in Routes (FE-01) | Wrap route parameter decoding in safe try/catch in `src/features/ExperienceRoutes.tsx` to prevent client DoS on malformed percent sequences | M2 | DONE | Explorer 2 |
| 5 | Lead Endpoint Origin Restriction (FE-02) | Restrict `leadEndpoint` in `src/lib/config.ts` to relative local paths (`/api/leads`) to prevent lead exfiltration | M2 | DONE | Explorer 2 |
| 6 | Vite Dev Server Filesystem Deny (FE-03) | Add `server.fs.deny` in `vite.config.ts` to block `.db` and `.env*` files over LAN | M2 | DONE | Explorer 2 |
| 7 | Safe Navigation Protocol Filtering (FE-04) | Reject `javascript:` and protocol-relative `//` URLs in `src/lib/site.ts` | M2 | DONE | Explorer 2 |
| 8 | Lead Form Non-JSON Error Handling (FE-05) | Guard `response.json()` parsing in `src/features/LeadForm.tsx` to prevent exposing raw syntax errors on HTML/proxy error responses | M2 | DONE | Explorer 2 |
| 9 | Iframe Sandboxing (FE-06) | Add `sandbox="allow-scripts allow-same-origin"` to Luma 3D tour iframe in `src/features/SceneViewer.tsx` | M2 | DONE | Explorer 2 |
| 10 | Security Scope & Applicability Mapping | Create `SECURITY_SCOPE.md` classifying all real vs non-existent technologies | M3 | DONE | Explorer 3 / R1 |
| 11 | Security Architecture Mapping | Create `SECURITY_ARCHITECTURE.md` documenting verified trust boundaries and data flows | M3 | DONE | Explorer 3 / R1 |
| 12 | Attack Surface Inventory | Create `SECURITY_ATTACK_SURFACE.md` documenting endpoints, parameters, and unauthenticated public catalog | M3 | DONE | Explorer 3 / R1 |
| 13 | Dependency Vulnerability Documentation | Create `SECURITY_DEPENDENCIES.md` documenting npm audit 0 CVEs and dependency health | M3 | DONE | Explorer 3 / R2 |
| 14 | Comprehensive Security Audit Report | Create `SECURITY_AUDIT_REPORT.md` with Executive Summary, Findings, Standards Mapping (OWASP ASVS, OWASP Top 10, CWE Top 25), and Metrics | M3 | DONE | Requirements R5 |
| 15 | E2E Security Test Suite | Create comprehensive regression tests in `tests/` verifying all remediations and security controls | E2E | DONE | Requirements R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Security Testing Track | Test suite infra, security regression tests in `tests/`, `TEST_INFRA.md`, `TEST_READY.md` | none | DONE |
| M1 | Server BFF Hardening | SEC-01, SEC-02, SEC-03 in `server/index.mjs` and `server/apiRouter.mjs` | none | DONE |
| M2 | Frontend Hardening | FE-01, FE-02, FE-03, FE-04, FE-05, FE-06 in `src/` and `vite.config.ts` | none | DONE |
| M3 | Security Documentation | `SECURITY_SCOPE.md`, `SECURITY_ARCHITECTURE.md`, `SECURITY_ATTACK_SURFACE.md`, `SECURITY_AUTHORIZATION_MATRIX.md`, `SECURITY_DEPENDENCIES.md`, `SECURITY_AUDIT_REPORT.md` | M1, M2 | DONE |
| M4 | Final Verification & Audit Gate | Run full test suite, build, security scan, review, challenge, and forensic audit | E2E, M1, M2, M3 | PLANNED |

## Interface Contracts
### Server BFF ↔ Client Browser
- Protocol: HTTP/1.1 JSON
- Security Headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin, Content-Security-Policy
- Endpoint `/api/leads`:
  - Request: `{ name: string, phone: string, topic?: string, consent: true, requestId: string, website?: string }`
  - Max Body: 8192 bytes
  - Response 200 OK: `{ ok: true, leadId: string }`
- Endpoint `/api/booking`:
  - Request: `{ name: string, phone: string, unit: string, apartmentId: string, consent: true, requestId: string, website?: string }`
  - Response 200 OK: `{ ok: true, bookingId: string }`
- Endpoint `/api/apartments/status`:
  - Response 200 OK: `{ ok: true, statuses: Record<string, 'available'|'reserved'|'sold'> }`

## Code Layout
- `server/index.mjs` (owned by Worker M1)
- `server/apiRouter.mjs` (owned by Worker M1)
- `src/features/ExperienceRoutes.tsx` (owned by Worker M2)
- `src/lib/config.ts` (owned by Worker M2)
- `src/lib/site.ts` (owned by Worker M2)
- `src/features/LeadForm.tsx` (owned by Worker M2)
- `src/features/SceneViewer.tsx` (owned by Worker M2)
- `vite.config.ts` (owned by Worker M2)
- `tests/` (owned by E2E Test Track Worker)
- `SECURITY_*.md` (owned by Worker M3)
