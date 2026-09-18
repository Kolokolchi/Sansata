# Test Infrastructure & Methodology (TEST_INFRA.md)

**Project:** Sansata Real-Estate Web Application  
**Test Framework:** Node.js Native Test Runner (`node:test`, `node:assert/strict`)  
**Target Platform:** Windows / Node.js v24 (Native ESM, TypeScript stripping & esbuild memory bundle)  
**Execution Command:** `npm.cmd test` (`node --test tests/*.test.mjs`)  

---

## 1. Test Architecture Overview

The Sansata automated test infrastructure is built upon lightweight, stack-native tooling with zero external runtime test framework overhead (such as Jest or Mocha), preserving fast turnaround (<500ms for the full suite) and deterministic execution.

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 node:test Test Runner                  │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                   ┌──────────────────────────┼────────────────────────────┐
                   ▼                          ▼                            ▼
         ┌───────────────────┐      ┌───────────────────┐        ┌───────────────────┐
         │ Native Server BFF │      │ Dynamic TS Bundle │        │ Client Domain     │
         │  Ephemeral HTTP   │      │  (esbuild memory) │        │  Math & Geometry  │
         │    (Port 0)       │      │   base64 import   │        │  Polygons/Centroid│
         └───────────────────┘      └───────────────────┘        └───────────────────┘
```

### Key Architectural Pillars
1. **Node.js Native Test Runner (`node:test` & `node:assert/strict`):**
   - Eliminates complex configuration files (`jest.config.js`, `babel.config.js`).
   - Native ESM execution without transpilation lag.
2. **Ephemeral Network Isolation:**
   - Server integration tests instantiate `createAppServer()` or `createServer(router)` bound to dynamic localhost port `0` (`127.0.0.1:0`).
   - Independent server lifecycle per test ensures zero port collisions and absolute test independence.
3. **In-Memory TypeScript Compilation (`esbuild`):**
   - For modules importing Vite client variables (`import.meta.env`) or TypeScript definitions (`src/lib/config.ts`, `src/lib/site.ts`, `src/features/ExperienceRoutes.tsx`), `esbuild.build()` bundles them in-memory into base64 data URLs.
   - Preserves exact production bundle semantics while executing natively inside Node.js.
4. **Adversarial Security Mocks:**
   - Outbound CRM calls (`BitrixAdapter`) and network sinks are mocked at the network boundary (`globalThis.fetch`), verifying that internal credentials and numerical CRM deal IDs are strictly dropped before returning public DTOs.

---

## 2. Four-Tier Security Testing Methodology

Security regression testing is structured across four progressive tiers to ensure defense-in-depth across both backend BFF and client SPA interfaces.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Tier 4: Real-World Security Scenarios (E2E consultation, Zero CRM leakage)   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Tier 3: Cross-Feature Combinations (Rate Limiter + Honeypot, 8 KB payload)  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Tier 2: Boundary & Corner Cases (Safe URI decode, //evil.com, fs.deny)      │
├──────────────────────────────────────────────────────────────────────────────┤
│  Tier 1: Feature Coverage for Server Security (CSP headers, Stream error, FIFO)│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage for Server Security
Covers core perimeter defenses and streaming resilience on the Node.js BFF HTTP server:
- **Content-Security-Policy Enforcement (`SEC-02`):** Validates that all static and SPA HTTP responses include a restrictive CSP header blocking dangerous script execution (`object-src 'none'`, `frame-ancestors 'none'`, `default-src 'self'`), while allowing required 3D resources (`https://*.lumalabs.ai` iframe embedding and WebGL blob assets).
- **Stream Error Resilience (`SEC-01`):** Verifies that filesystem stream read errors (`createReadStream.pipe(res)`) emit handled `'error'` events, destroy the stream, and return HTTP 500 JSON without crashing the Node.js runtime process.
- **Idempotency Map Bounded Capacity (`SEC-03`):** Validates that `receivedRequests` Map enforces `MAX_RECEIVED_REQUESTS = 10000` with strict FIFO eviction of the oldest entry when capacity is reached.

### Tier 2: Boundary & Corner Cases
Covers edge cases, protocol manipulation, and client-side DoS vectors:
- **Safe URI Decoding (`FE-01`):** Tests that malformed percent-encoding sequences (`%FF`, `%E0%A0`, incomplete escapes) are safely handled by `safeDecode` in `ExperienceRoutes.tsx` without throwing unhandled `URIError` exceptions that would unmount the React component tree.
- **Lead Endpoint Origin Restriction (`FE-02`):** Tests that `parseExperience()` in `src/lib/config.ts` accepts local relative paths (`/api/leads`) while strictly rejecting external HTTPS endpoints (`https://attacker.com/steal`) and protocol-relative paths (`//evil.com`).
- **Safe Navigation Protocol Filtering (`FE-04`):** Verifies that client-side SPA navigation `navigateTo()` in `src/lib/site.ts` drops dangerous pseudo-protocols (`javascript:`, `data:`, `vbscript:`) and protocol-relative redirects (`//`).
- **Vite Dev Server Filesystem Deny (`FE-03`):** Validates that `vite.config.ts` configures `server.fs.deny` with `['**/*.db', '**/.env*']`, preventing accidental LAN exposure of SQLite databases or environment files during development.

### Tier 3: Cross-Feature Combinations
Covers interactions between multiple independent security controls:
- **Rate Limiter + Honeypot Interaction:** Verifies that when a spam bot fills out the hidden `website` honeypot field, the server returns a silent HTTP 200 OK without persisting data or calling Bitrix, *and* the request still consumes an entry from the IP's rate limit quota (3 requests / 10 min), resulting in HTTP 429 Too Many Requests with a valid `Retry-After` header upon the 4th attempt.
- **Payload Limits & Prototype Pollution Defense:** Verifies that payloads exceeding 8,192 bytes return HTTP 413 Payload Too Large, and objects containing `__proto__`, `constructor`, or `prototype` keys are rejected with HTTP 400 across all endpoints (`/api/leads`, `/api/booking`).

### Tier 4: Real-World Security Scenarios
Simulates realistic end-to-end user transactions under active CRM integration:
- **Zero Trust CRM Isolation:** Simulates a complete consultation and booking submission where the external Bitrix24 REST API responds with internal numerical IDs (`49201`, `778899`), webhook authentication tokens, and internal `UF_CRM_*` custom fields. Asserts that the client response contains exclusively a public UUID (`leadId` / `bookingId`) and zero CRM internals or secret tokens.
- **Apartment Status Feed Sanitization:** Feeds raw CRM entities (including numeric IDs, internal deal names, and unverified units) into `StatusCache` and asserts that the public `/api/apartments/status` endpoint exposes strictly canonical catalog IDs (`shattyq-*` and `s*-f*-u*`).

---

## 3. Test Suite Inventory & Coverage Mapping

| Test File | Focus Area | Tiers / Standards | Test Count |
|---|---|---|---|
| `tests/security_remediation.test.mjs` | Security remediation & hardening | Tiers 1, 2, 3, 4 | 11 |
| `tests/api_security.test.mjs` | BFF security perimeter & OWASP Top 10 | OWASP API1-API8 | 8 |
| `tests/config.test.mjs` | Experience configuration & 3D tour schema | Schema & Validation | 5 |
| `tests/leads.test.mjs` | Phone normalization, validation, IP extraction | Zero Trust Input | 3 |
| `tests/site.test.mjs` | Routing prefix, subpath & deep link resolution | SPA Routing | 2 |
| `tests/journey.test.mjs` | Interactive floor/section routes & polygon models | UX & Hierarchy | 8 |
| `tests/geometry.test.mjs` | SVG centroid math, convex & concave polygons | Spatial Math | 4 |
| `tests/visual-tour.test.mjs` | Multi-angle panoramas & floor plan summaries | 3D Tour Data | 3 |
| **Total** | | | **44** |

---

## 4. Execution Commands

### Fast Unit & Security Suite (Recommended for CI / Pre-Commit)
```powershell
npm.cmd test
```
- **Execution Target:** `node --test tests/*.test.mjs`
- **Expected Duration:** ~450ms
- **Pass Criteria:** 44 passed, 0 failed, 0 skipped.

### Production Bundle Secret Scan
```powershell
npm.cmd run security:scan
```
- **Execution Target:** `node scripts/scan-bundle-secrets.mjs`
- **Pass Criteria:** Zero CRM tokens, webhook URLs, or `UF_CRM_*` fields in `dist/`.

### TypeScript Compilation & Production Build
```powershell
npm.cmd run build
```
- **Execution Target:** `tsc && vite build`
- **Pass Criteria:** 0 TypeScript compilation errors, clean Rollup chunk generation.

### End-to-End Browser Suite (Playwright)
```powershell
npm.cmd run test:e2e
```
- **Execution Target:** `playwright test`
- **Pass Criteria:** Visualizer, selection overlay, and booking modal flows pass across desktop and mobile viewports.
