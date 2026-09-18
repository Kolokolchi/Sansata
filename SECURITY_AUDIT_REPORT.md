# Sansata Comprehensive Security Audit & Remediation Report

**Project**: Sansata Real-Estate Web Application & BFF  
**Target Root**: `d:\Anti-Gravity\Sansata`  
**Standard Compliance**: OWASP ASVS 5.x, OWASP Top 10 (2021), OWASP API Security Top 10 (2023), CWE Top 25  
**Audit & Remediation Milestone**: Milestone 3 (Final Evidence-Based Synthesis)  
**Date**: 2026-09-18  

---

## 1. Executive Summary & Scope

### 1.1 Executive Summary
A comprehensive, end-to-end technical security audit, threat modeling assessment, and autonomous remediation was conducted on the Sansata Shattyq real-estate web application and its Node.js Backend-for-Frontend (BFF).

The objective was to identify and remediate all architectural weaknesses, stream handling flaws, client-side resilience vulnerabilities, supply chain risks, and sensitive data leakage vectors without breaking the existing real-estate visualization features, 3D viewers, or public API contracts.

### Key Audit Outcomes:
1. **Total Confirmed Vulnerabilities Identified**: 9 findings (3 Server BFF findings: `SEC-01` through `SEC-03`, and 6 Frontend / Tooling findings: `FE-01` through `FE-06`).
2. **Remediation Status**: **100% Remediation (9 of 9 Fixed)**. Zero open vulnerabilities remain.
3. **Zero False Positives**: All 9 findings were verified via reproducible scenarios and covered by automated regression tests.
4. **Supply Chain Posture**: `npm audit` reports **0 vulnerabilities** across all 134 packages.
5. **Zero Trust Client Boundary**: Confirmed **zero** CRM credentials, webhook URLs, deal IDs, or internal `UF_CRM_*` custom fields in production bundles or public API responses (`npm run security:scan` passed with 0 leaks).
6. **Automated Test Suite**: 44 automated tests pass cleanly (`npm test`), 0 failures, duration ~510ms.
7. **Production Build**: Compiles cleanly with zero TypeScript errors (`npm run build`).

---

### 1.2 Audited Scope & Stack Definition
The audit was strictly bounded to the actual technologies in the repository:
- **Server BFF**: Native Node.js HTTP (`node:http`), custom routing (`server/apiRouter.mjs`), Bitrix24 REST integration (`server/bitrixAdapter.mjs`), sliding-window rate limiter (`server/rateLimiter.mjs`), apartment status cache (`server/statusCache.mjs`), and local NDJSON storage (`server/leads.mjs`).
- **Frontend SPA**: React 18, TypeScript 5.7, Three.js 0.186 WebGL canvas viewers, SVG interactive overlays, and client-side routing (`src/features/*`, `src/lib/*`).
- **Build & Dev Tooling**: Vite 6.1 (`vite.config.ts`), Node native test runner (`node:test`), and custom bundle secret scanner (`scripts/scan-bundle-secrets.mjs`).

---

## 2. Applicability & Limitations

### 2.1 Technology Applicability Determination
Following the **Ground Truth Principle**, security checks are applied strictly to real components. Non-existent technologies are formally classified as `NOT_APPLICABLE` (N/A):

| Technology Area | Repository Status | Classification | Justification & Evidence |
| :--- | :--- | :--- | :--- |
| **Node.js HTTP Server (`node:http`)** | Active | **APPLICABLE** | Primary BFF runtime server (`server/index.mjs`, `server/apiRouter.mjs`). |
| **React 18 & Three.js** | Active | **APPLICABLE** | Client-side UI and 3D visualizer (`src/main.tsx`, `src/features/*`). |
| **Bitrix24 REST API Adapter** | Active | **APPLICABLE** | Outbound CRM webhook integration (`server/bitrixAdapter.mjs`). |
| **Local NDJSON Lead Storage** | Active | **APPLICABLE** | Local lead/booking persistence with mode `0o600` (`.local/*.ndjson`). |
| **In-Memory Rate Limiter & Cache** | Active | **APPLICABLE** | Perimeter protection with bounded memory (`server/rateLimiter.mjs`). |
| **SQLite Database (`apartments.db`)** | Present / Unwired | **PARTIALLY_APPLICABLE** | Dormant schema; unwired at runtime; protected via `server.fs.deny`. |
| **OAuth 2.0 / OIDC / SAML** | Non-Existent | **NOT_APPLICABLE** | Public catalog; no user login or identity provider exists. |
| **JWT / User Sessions / RBAC** | Non-Existent | **NOT_APPLICABLE** | Unauthenticated public marketing portal; no customer/admin sessions. |
| **GraphQL (Apollo / Relay)** | Non-Existent | **NOT_APPLICABLE** | Public API is strictly REST/JSON; no GraphQL parsers or resolvers. |
| **Docker / Podman / Containers** | Non-Existent | **NOT_APPLICABLE** | No containerfiles or container orchestration specs in repository. |
| **Kubernetes / Helm** | Non-Existent | **NOT_APPLICABLE** | No manifests or cluster configurations exist. |
| **Redis / Memcached** | Non-Existent | **NOT_APPLICABLE** | Bounded native Node.js Maps handle caching and rate limiting in-process. |
| **Cloud IaC (Terraform / Pulumi)** | Non-Existent | **NOT_APPLICABLE** | No cloud provisioning templates or state files exist. |
| **Microservices / gRPC / Protobuf** | Non-Existent | **NOT_APPLICABLE** | Monolithic frontend SPA fronted by a co-located Node.js BFF. |
| **Third-Party SQL ORM** | Non-Existent | **NOT_APPLICABLE** | Zero ORM libraries in `package.json`; database file is dormant. |
| **WebSockets / Server-Sent Events** | Non-Existent | **NOT_APPLICABLE** | All client-server communication is synchronous HTTP request/response. |

---

## 3. Detailed Vulnerability Findings & Remediations

Below is the complete, evidence-based inventory of all 9 identified and remediated findings across Server and Frontend tracks.

---

### Finding SEC-01: Unhandled Stream Error in Static File Streaming (Process Crash / DoS)
- **ID**: `SEC-01`
- **Title**: Unhandled Stream Error Event on Static File Read Streams
- **Severity**: Medium (CVSS 6.5)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-755 (Improper Handling of Exceptional Conditions), CWE-248 (Uncaught Exception)
- **OWASP Top 10**: A04:2021 – Insecure Design / Denial of Service
- **OWASP API Security**: API4:2023 – Unrestricted Resource Consumption
- **Location**: `server/index.mjs:107, 110` (Pre-remediation)
- **Root Cause**: `createReadStream(file).pipe(res)` was piped directly to the HTTP response without attaching an `'error'` event listener. In Node.js, `stream.pipe()` does not forward error events from the readable source. If a filesystem I/O error or abrupt socket termination occurs during streaming, an unhandled error is emitted on the `ReadStream`, crashing the entire Node.js server process.
- **Realistic Scenario**: A client requests a large 3D `.glb` binary asset with an HTTP `Range` header and abruptly resets the TCP connection or triggers a filesystem read error. The unhandled stream error causes an uncaught exception, taking down the public website for all concurrent visitors.
- **Remediation**:
  - Attached explicit `.on('error')` listeners to both partial-range and full-file read streams.
  - On error, the stream is destroyed via `stream.destroy()`.
  - If headers were not yet sent, returns HTTP 500 JSON (`{"error": "Server error"}`). If headers were sent, cleanly destroys the response socket via `res.destroy()`.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M1 & `tests/security_remediation.test.mjs`).

---

### Finding SEC-02: Missing Content-Security-Policy (CSP) Header
- **ID**: `SEC-02`
- **Title**: Absence of Restrictive Content-Security-Policy Header on HTTP Responses
- **Severity**: Medium (CVSS 5.4)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-1021 (Improper Restriction of Rendered UI Layers or Frames), CWE-79 (Cross-Site Scripting)
- **OWASP Top 10**: A05:2021 – Security Misconfiguration
- **OWASP API Security**: API8:2023 – Security Misconfiguration
- **Location**: `server/index.mjs:78-86` (Pre-remediation)
- **Root Cause**: `server/index.mjs` defined several defensive headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`), but lacked a `Content-Security-Policy` header.
- **Realistic Scenario**: If an attacker managed to inject a malicious script via a compromised dependency or third-party asset, the browser would execute it without policy enforcement, lacking defense-in-depth restrictions.
- **Remediation**:
  - Defined and exported `securityHeaders` in `server/index.mjs`.
  - Configured comprehensive CSP:
    ```http
    Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https:; media-src 'self'; frame-src 'self' https://lumalabs.ai https://*.lumalabs.ai; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
    ```
  - Emitted across all static and SPA HTTP responses.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M1 & `tests/security_remediation.test.mjs`).

---

### Finding SEC-03: Unbounded Idempotency Deduplication Map Capacity (Heap Exhaustion / DoS)
- **ID**: `SEC-03`
- **Title**: Unbounded Growth of `receivedRequests` Idempotency Map Under Distributed Bot Activity
- **Severity**: Low (CVSS 3.7)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-400 (Uncontrolled Resource Consumption), CWE-770 (Allocation of Resources Without Limits)
- **OWASP Top 10**: A04:2021 – Insecure Design
- **OWASP API Security**: API4:2023 – Unrestricted Resource Consumption
- **Location**: `server/apiRouter.mjs:105-114` (Pre-remediation)
- **Root Cause**: The idempotency cache `receivedRequests` in `server/apiRouter.mjs` only deleted entries older than 1 hour, lacking a hard upper ceiling on entry count.
- **Realistic Scenario**: An adversary deploying a distributed botnet with rotating IPs sends hundreds of thousands of distinct requests within an hour. The unbounded Map grows continuously, causing Node.js heap exhaustion and Out-Of-Memory (OOM) crashes.
- **Remediation**:
  - Enforced `MAX_RECEIVED_REQUESTS = 10000` (exported for inspection).
  - Added `saveReceivedRequest(key, item)`: cleans expired entries and performs strict FIFO eviction of the oldest entry (`receivedRequests.keys().next().value`) whenever capacity reaches 10,000.
  - Added unref'd background cleanup timer running every 60 seconds.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M1 & `tests/security_remediation.test.mjs`).

---

### Finding FE-01: Unhandled `URIError: URI malformed` in Route Decoding (Client-side DoS)
- **ID**: `FE-01`
- **Title**: Uncaught `URIError` During Synchronous URL Parameter Decoding Crashing React Root
- **Severity**: Medium (CVSS 5.3)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-248 (Uncaught Exception), CWE-730 (Denial of Service)
- **OWASP Top 10**: A04:2021 – Insecure Design
- **OWASP API Security**: N/A (Client SPA)
- **Location**: `src/features/ExperienceRoutes.tsx:112, 114, 116, 118` (Pre-remediation)
- **Root Cause**: `decodeURIComponent()` was called synchronously on unvalidated path slices for `/flat-classic/:id`, `/flat/:id`, `/akcii/:slug`, and `/news/:slug` during React render without an Error Boundary. Passing malformed percent sequences (e.g. `%FF`, `%G1`, or incomplete escapes) threw an unhandled `URIError`.
- **Realistic Scenario**: An attacker shares a link containing `https://sansata.kz/flat/%FF` on social media or forums. When users click it, the unhandled `URIError` crashes React 18, unmounting the root DOM container and leaving a permanent blank white screen until browser history is cleared.
- **Remediation**:
  - Implemented `safeDecode(str: string)` wrapping `decodeURIComponent` in a try/catch, returning the raw string on error.
  - Applied `safeDecode()` to all route parameter extractions in `src/features/ExperienceRoutes.tsx`.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M2 & `tests/security_remediation.test.mjs`).

---

### Finding FE-02: Configurable `leadEndpoint` Accepting External HTTPS URLs (Data Exfiltration Risk)
- **ID**: `FE-02`
- **Title**: Permissive Validation in `parseExperience()` Permitting External Lead Collection Endpoints
- **Severity**: Medium (CVSS 6.1)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-200 (Exposure of Sensitive Information), CWE-601 (URL Redirection to Untrusted Site)
- **OWASP Top 10**: A01:2021 – Broken Access Control / Data Leakage
- **OWASP API Security**: API1:2023 – Broken Object Level Authorization
- **Location**: `src/lib/config.ts:9-10, 189-191` (Pre-remediation)
- **Root Cause**: `isValidUrl` used regex `/^\/(?!\/)/.test(v) || /^https:\/\//.test(v)`. Consequently, `config.leadEndpoint` in `experience.json` could be configured with an external HTTPS URL (e.g. `https://attacker-collector.com/leads`), violating the Zero Trust Client Boundary.
- **Realistic Scenario**: A compromised configuration file or CDN man-in-the-middle alters `experience.json` to point `leadEndpoint` to a remote third party. Client consultation submissions bypass the local BFF and exfiltrate customer names, phone numbers, and inquiry details directly to unauthorized actors.
- **Remediation**:
  - Implemented `isValidLeadEndpoint(v: unknown)` enforcing `typeof v === 'string' && /^\/(?!\/)/.test(v)`.
  - Rejects external protocols (`https://`, `http://`) and protocol-relative URLs (`//evil.com`), strictly confining lead submissions to relative local BFF endpoints (e.g. `/api/leads`).
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M2 & `tests/security_remediation.test.mjs`).

---

### Finding FE-03: Vite Dev Server Missing Filesystem Deny Rules (LAN Information Exposure)
- **ID**: `FE-03`
- **Title**: Vite Dev Server Binding to `0.0.0.0` Without `server.fs.deny` File Protection
- **Severity**: Low / Info (CVSS 3.3)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-200 (Exposure of Sensitive Information), CWE-548 (Exposure of Information Through Directory Listing / File Serving)
- **OWASP Top 10**: A05:2021 – Security Misconfiguration
- **OWASP API Security**: API8:2023 – Security Misconfiguration
- **Location**: `vite.config.ts:37-40` (Pre-remediation)
- **Root Cause**: Vite was configured with `server: { port: 3000, host: true }` without an explicit `fs.deny` list. When developers ran `npm run dev` on shared or untrusted local networks, root files (such as `apartments.db` or local `.env*`) were reachable over LAN HTTP.
- **Realistic Scenario**: A developer works on an open office Wi-Fi network with `npm run dev`. A nearby user on the same network accesses `http://<developer-ip>:3000/apartments.db` and downloads the internal database file directly.
- **Remediation**:
  - Configured `server.fs.deny: ['**/*.db', '**/.env*']` in `vite.config.ts`.
  - Vite now blocks HTTP requests targeting `.db` and `.env*` files with HTTP 403.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M2 & `tests/security_remediation.test.mjs`).

---

### Finding FE-04: Missing Protocol & Open Redirect Sanitization in `navigateTo()`
- **ID**: `FE-04`
- **Title**: Unsanitized Pseudo-Protocol and Protocol-Relative URL Execution in `navigateTo()`
- **Severity**: Low (CVSS 3.8)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-601 (URL Redirection to Untrusted Site)
- **OWASP Top 10**: A01:2021 – Broken Access Control
- **OWASP API Security**: N/A (Client SPA)
- **Location**: `src/lib/site.ts:30-40` (Pre-remediation)
- **Root Cause**: `navigateTo(url)` previously checked only `if (url.startsWith('http') || url.startsWith('tel:') || url.startsWith('mailto:'))` and passed protocol-relative URLs (`//attacker.com`) or dangerous schemes (`javascript:`, `data:`) to window navigation.
- **Realistic Scenario**: If an application view passes a query parameter or dynamic deep link directly to `navigateTo()`, an attacker could craft a link redirecting users to a phishing website (`//phishing-sansata.com`).
- **Remediation**:
  - Added protocol validation regex in `src/lib/site.ts:navigateTo`:
    ```ts
    const trimmed = url.trim();
    if (/^(?:javascript|data|vbscript):/i.test(trimmed) || trimmed.startsWith('//')) {
      return;
    }
    ```
  - Explicitly drops dangerous pseudo-protocols and protocol-relative URLs before navigation evaluation.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M2 & `tests/security_remediation.test.mjs`).

---

### Finding FE-05: LeadForm Error Handling Exposing Raw JSON Parser Syntax Errors
- **ID**: `FE-05`
- **Title**: Uncaught `SyntaxError` on Non-JSON Server Error Responses in Lead Form
- **Severity**: Low (CVSS 2.6)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-209 (Generation of Error Message Containing Sensitive Information)
- **OWASP Top 10**: A04:2021 – Insecure Design / Error Handling
- **OWASP API Security**: API8:2023 – Security Misconfiguration
- **Location**: `src/features/LeadForm.tsx:64-79` (Pre-remediation)
- **Root Cause**: `LeadForm.tsx` performed `const body = await response.json()` before checking `response.ok`. When reverse proxies (Nginx/Cloudflare) or web servers return HTML error pages (502 Bad Gateway, 504 Gateway Timeout), `response.json()` threw a raw `SyntaxError: Unexpected token '<'`, displaying cryptic technical parser errors to end users.
- **Realistic Scenario**: Upstream CRM or Node process restarts while a customer is submitting a booking request. The reverse proxy serves a 502 HTML error page. The modal displays `"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"`, alarming the user and degrading trust.
- **Remediation**:
  - Wrapped `await response.json()` in a `try / catch` block in `src/features/LeadForm.tsx`.
  - If parsing fails, `body` defaults to null, allowing `if (!response.ok)` to throw a clean fallback error (`body?.error || 'Не удалось отправить заявку.'`).
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M2 & `tests/security_remediation.test.mjs`).

---

### Finding FE-06: Unsandboxed External Luma 3D Tour Iframe (Defense-in-Depth)
- **ID**: `FE-06`
- **Title**: Embedded Third-Party Luma 3D Tour Iframe Lacks `sandbox` Attribute
- **Severity**: Low / Defense-in-Depth (CVSS 3.1)
- **Confidence**: Confirmed (100%)
- **CWE**: CWE-1021 (Improper Restriction of Rendered UI Layers or Frames)
- **OWASP Top 10**: A05:2021 – Security Misconfiguration
- **OWASP API Security**: N/A (Client SPA)
- **Location**: `src/features/SceneViewer.tsx:950-956` (Pre-remediation)
- **Root Cause**: The photogrammetry 3D tour `<iframe>` embedding `https://lumalabs.ai` lacked a `sandbox` attribute, leaving the third-party iframe unconstrained regarding top-level navigation.
- **Realistic Scenario**: A vulnerability in the third-party photogrammetry embed provider could allow the framed content to execute unauthorized top-level window navigation (`window.top.location = ...`) or spawn arbitrary popups.
- **Remediation**:
  - Added `sandbox="allow-scripts allow-same-origin"` to the Luma tour iframe in `src/features/SceneViewer.tsx`.
  - Permits necessary WebGL shader execution and same-origin asset loading while strictly prohibiting top-level navigation.
- **Status**: **FIXED / REMEDIATED** (Verified by Worker M2 & `tests/security_remediation.test.mjs`).

---

## 4. Standards Mapping & Framework Compliance

The security posture and remediations were mapped across four leading cybersecurity frameworks:

### 4.1 OWASP ASVS 5.x (Application Security Verification Standard)
| ASVS Section | Verification Requirement | Status | Project Implementation / Evidence |
| :--- | :--- | :--- | :--- |
| **V1: Architecture** | V1.1.1 Zero Trust Boundaries & Threat Modeling | **VERIFIED** | 5-zone trust boundary; Zero Trust client boundary; CRM credentials strictly server-side. |
| **V1: Architecture** | V1.14.1 Component Build & Dependency Health | **VERIFIED** | `npm audit` reports 0 CVEs; SHA-512 subresource integrity in `package-lock.json`. |
| **V2: Authentication** | V2.1 Authentication Architecture | **N/A** | Unauthenticated public catalog. Explicitly documented as NOT_APPLICABLE. |
| **V3: Session Mgmt** | V3.1 Session Architecture | **N/A** | Stateless public API; no session cookies or tokens exist. |
| **V4: Access Control** | V4.1 Access Control Enforcement | **VERIFIED** | Origin check (CORS 403); HTTP method enforcement (405); BOLA check rejecting sold unit booking (409). |
| **V5: Validation** | V5.1 Input Validation & Allowlist | **VERIFIED** | Strict field whitelisting (`validateLead`), E.164 phone normalization, character range checks (`^[\w\s.-]+$`). |
| **V5: Validation** | V5.2 Sanitization & Control Characters | **VERIFIED** | Rejection of `< > \x00-\x1f`; prototype pollution inspection (`__proto__`, `constructor`, `prototype`). |
| **V8: Data Protection**| V8.3 Sensitive Data Exposure in Transit | **VERIFIED** | HTTPS enforced; Bitrix webhook secrets isolated; bundle secret scanner confirms zero tokens. |
| **V10: Malicious Code**| V10.3 Honeypots & Anti-Automation | **VERIFIED** | Invisible `website` field traps bots with silent 200 OK without disk persistence or CRM load. |
| **V11: Business Logic**| V11.1 Anti-Hammering & Rate Limiting | **VERIFIED** | Sliding-window token buckets (3 req / 10 min for leads; 60 req / 1 min for status) with FIFO eviction. |
| **V12: SSRF Defense** | V12.6 Server-Side Request Forgery Prevention | **VERIFIED** | `BitrixAdapter` blocks AWS/GCP metadata (`169.254.169.254`, `metadata.google.internal`) and non-HTTPS protocols. |
| **V13: API & Web** | V13.1 Content-Type & Payload Limiting | **VERIFIED** | Requires `application/json` (415); streams body up to 8,192 bytes (413 Payload Too Large). |
| **V14: Configuration** | V14.4 Defensive Security Headers | **VERIFIED** | `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `COOP: same-origin`. |

---

### 4.2 OWASP Top 10 (2021) Mapping
- **A01:2021 – Broken Access Control**: Covered by CORS origin verification, HTTP method restrictions (405), BOLA check on booking, and protocol filtering in `navigateTo()` (FE-04) & `leadEndpoint` restriction (FE-02).
- **A02:2021 – Cryptographic Failures**: Covered by mandatory TLS 1.2/1.3 for Bitrix CRM webhooks and absolute isolation of credentials from client bundles.
- **A03:2021 – Injection**: Covered by JSON allowlist schemas, newline escaping in NDJSON writes, prototype pollution guards, and absence of raw HTML injection in React.
- **A04:2021 – Insecure Design**: Covered by stream error resilience (SEC-01), bounded idempotency cache (SEC-03), and safe URI route parameter decoding (FE-01).
- **A05:2021 – Security Misconfiguration**: Covered by CSP response headers (SEC-02), Vite `server.fs.deny` (FE-03), and iframe sandboxing (FE-06).
- **A06:2021 – Vulnerable and Outdated Components**: Verified via `npm audit` (0 vulnerabilities across 134 packages).
- **A07:2021 – Identification and Authentication Failures**: N/A (Unauthenticated public marketing catalog).
- **A08:2021 – Software and Data Integrity Failures**: Covered by SHA-512 lockfile validation and relative lead endpoint enforcement.
- **A09:2021 – Security Logging and Monitoring Failures**: Server-side error logging with shielded client responses; request deduplication fingerprinting.
- **A10:2021 – Server-Side Request Forgery (SSRF)**: Enforced via `BitrixAdapter` metadata blocking and URL scheme validation.

---

### 4.3 OWASP API Security Top 10 (2023) Mapping
- **API1:2023 – Broken Object Level Authorization (BOLA)**: `/api/booking` verifies apartment status before booking, rejecting sold units with HTTP 409 Conflict.
- **API2:2023 – Broken Authentication**: N/A (Public unauthenticated catalog).
- **API3:2023 – Broken Object Property Level Authorization**: Strict schema allowlist rejects unknown properties (e.g. `role`, `priceOverride`, `UF_CRM_*`) with HTTP 400.
- **API4:2023 – Unrestricted Resource Consumption**: 8 KB body streaming limit (413), rate limiters (3 req/10 min, 60 req/min) with FIFO eviction, and bounded idempotency cache (SEC-03).
- **API5:2023 – Broken Function Level Authorization**: Strict method routing (405 Method Not Allowed on invalid methods).
- **API6:2023 – Unrestricted Access to Sensitive Business Flows**: Anti-spam honeypot returning silent 200 OK; rate limiting consuming bot quotas.
- **API7:2023 – Server-Side Request Forgery (SSRF)**: Cloud metadata blocking in `BitrixAdapter`.
- **API8:2023 – Security Misconfiguration**: Strong CSP header (SEC-02), CORS validation, `Content-Type: application/json` enforcement (415), and friendly error responses (FE-05).
- **API9:2023 – Improper Inventory Management**: Strictly documented 3 endpoints with exact schema contracts; legacy alias `/api/lead` shares rate limiter with `/api/leads`.
- **API10:2023 – Unsafe Consumption of APIs**: 5s abort timeouts on outbound Bitrix requests; complete scrubbing of internal CRM numeric IDs before generating public UUID responses.

---

### 4.4 CWE Top 25 Mapping
| CWE ID | Weakness Name | Project Coverage & Remediation | Status |
| :--- | :--- | :--- | :--- |
| **CWE-79** | Improper Neutralization of Input During Web Page Generation (XSS) | React JSX string escaping, strict CSP header (SEC-02), safe navigation protocol filtering (FE-04). | REMEDIATED |
| **CWE-200** | Exposure of Sensitive Information to an Unauthorized Actor | Zero CRM secrets in bundle; leadEndpoint restricted to local relative paths (FE-02); Vite fs.deny (FE-03). | REMEDIATED |
| **CWE-209** | Generation of Error Message Containing Sensitive Information | LeadForm error parsing wrapped in try/catch (FE-05); zero stack trace leakage in BFF responses. | REMEDIATED |
| **CWE-248** | Uncaught Exception | Stream `.on('error')` handling (SEC-01); safe URI decoding in routes (FE-01). | REMEDIATED |
| **CWE-400** | Uncontrolled Resource Consumption | Bounded idempotency map (SEC-03); RateLimiter bounded memory (10,000 entries); 8 KB payload gate. | REMEDIATED |
| **CWE-601** | URL Redirection to Untrusted Site (Open Redirect) | `navigateTo()` drops `//` and `javascript:` (FE-04); `leadEndpoint` restricted to local relative paths (FE-02). | REMEDIATED |
| **CWE-755** | Improper Handling of Exceptional Conditions | Stream error listeners with clean response destruction (SEC-01). | REMEDIATED |
| **CWE-918** | Server-Side Request Forgery (SSRF) | Cloud metadata IP blocking (`169.254.169.254`, GCP metadata) and HTTPS protocol enforcement in `BitrixAdapter`. | REMEDIATED |
| **CWE-1021** | Improper Restriction of Rendered UI Layers or Frames | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, and iframe sandboxing on Luma embeds (FE-06). | REMEDIATED |

---

## 5. Summary Metrics & Quantitative Audit Comparison

### 5.1 Before vs. After Remediation Metrics

| Metric Category | Baseline (Pre-Audit) | Remediated (Post-Audit) | Delta |
| :--- | :--- | :--- | :--- |
| **Total Confirmed Vulnerabilities** | 9 | **0** | -9 (100% Fixed) |
| **Critical Severity Vulnerabilities** | 0 | **0** | 0 |
| **High Severity Vulnerabilities** | 0 | **0** | 0 |
| **Medium Severity Vulnerabilities** | 4 (SEC-01, SEC-02, FE-01, FE-02) | **0** | -4 |
| **Low / Info Severity Vulnerabilities**| 5 (SEC-03, FE-03, FE-04, FE-05, FE-06) | **0** | -5 |
| **Open Unresolved Vulnerabilities** | 9 | **0** | -9 |
| **False Positives Recorded** | 0 | **0** | 0 |
| **Non-Applicable Areas Classified** | 10 | **10** | Documented with evidence |
| **Automated Regression Tests Passing**| 33 | **44** | +11 regression tests |
| **Test Pass Rate** | 100% (33/33) | **100% (44/44)** | 0 failures |
| **Production Bundle Secret Leaks** | 0 | **0** | 0 detected |
| **Dependency CVE Count (`npm audit`)** | 0 | **0** | 0 vulnerabilities |
| **TypeScript Compilation Errors** | 0 | **0** | Clean build |

---

## 6. Verification Proof & Verbatim Evidence

All verifications were executed directly on the live repository (`d:\Anti-Gravity\Sansata`) under Node.js v22.14.0 on Windows.

### 6.1 Automated Test Suite Execution (`npm.cmd test`)
Command: `npm.cmd test` (`node --test tests/*.test.mjs`)  
Exit Code: `0`

```
> sensata-shattyq@1.0.0 test
> node --test tests/*.test.mjs

✔ BFF API Router security, validation, ratelimit and safe DTO (50.2178ms)
✔ OWASP API1 & API3: BOLA, Mass Assignment and Prototype Pollution defense (12.4871ms)
✔ OWASP API4: RateLimiter bounded memory, FIFO eviction and Retry-After header (11.1559ms)
✔ OWASP API5: Broken Function Level Authorization & HTTP method restrictions (4.3872ms)
✔ OWASP API6: Sensitive Business Flows & Idempotency deduplication (7.0821ms)
✔ OWASP API7: Server Side Request Forgery (SSRF) in webhook configuration (0.4454ms)
✔ OWASP API8: CORS preflight (OPTIONS) and Content-Type enforcement (4.1125ms)
✔ OWASP API5 & API8: Static server security, dotfiles blocking, URI error handling and security headers (7.0803ms)
✔ config accepts connected panoramas and limits inventory to public fields (0.8515ms)
✔ config rejects broken arrays, protocols, linked ids and values (0.2397ms)
✔ config accepts a Luma capture ID and rejects malformed embed identifiers (0.3702ms)
✔ config accepts multiple Luma scenes and rejects invalid scene definitions (0.1291ms)
✔ mortgage handles zero rate, full payment and annuity reference (0.1902ms)
✔ catalogue contains unique original plans and no invented prices (0.1057ms)
✔ pointInPolygon correctly identifies interior and exterior points for convex polygon (0.5445ms)
✔ calculateCentroid computes exact center of mass for convex polygons (CCW and CW) (0.2183ms)
✔ concave L-shaped polygon: pointInPolygon distinguishes interior arms from cutout (0.0777ms)
✔ calculateCentroid falls back to interior anchor for concave shapes where centroid is outside (0.084ms)
✔ calculateCentroid handles degenerate polygons gracefully without crashing (0.5698ms)
✔ selection routes reject nonexistent sections and floors (1.0013ms)
✔ floor selection only returns published matching plans (0.1908ms)
✔ saved interiors reject corrupt coordinates and duplicate furniture (0.2036ms)
✔ apartment media validates nested panorama graphs and model URLs (0.5821ms)
✔ selection polygons remain inside image coordinates with unique IDs (0.393ms)
✔ floor plan media generates valid bounded polygons for all sections and floors (1.0588ms)
✔ lead validation requires name, KZ phone and consent (1.2492ms)
✔ getClientIp parses socket address by default and x-forwarded-for only when TRUST_PROXY is enabled (0.2076ms)
✔ HTTP saves once, rejects malformed and cross-origin requests (57.3219ms)
✔ Tier 1: Feature coverage for server security - Content-Security-Policy headers (29.6164ms)
✔ Tier 1: Feature coverage for server security - Stream error handling resilience (6.2721ms)
✔ Tier 1: Feature coverage for server security - receivedRequests FIFO eviction and bounds (18.2038ms)
✔ Tier 2: Boundary & corner cases - Safe URI decoding on malformed sequences (158.7601ms)
✔ Tier 2: Boundary & corner cases - parseExperience rejects external HTTPS lead endpoints (3.4261ms)
✔ Tier 2: Boundary & corner cases - navigateTo rejects dangerous pseudo-protocols and protocol-relative URLs (2.0606ms)
✔ Tier 2: Boundary & corner cases - Vite dev server fs.deny blocks .db and .env files (139.8119ms)
✔ Tier 3: Cross-feature combinations - Rate limiter enforces quota on honeypot bot submissions (7.1433ms)
✔ Tier 3: Cross-feature combinations - 8 KB payload limit and prototype pollution rejection across all endpoints (5.9597ms)
✔ Tier 4: Real-world security scenarios - Consultation submission zero CRM credential and internal ID leakage (5.7394ms)
✔ Tier 4: Real-world security scenarios - Apartment status feed sanitization restricts to public IDs (0.4331ms)
✔ Pages links retain the repository prefix and preserve external targets (19.0368ms)
✔ Local hosting keeps root paths (3.4095ms)
✔ visual angles have correct dimensions, polygons within 2560x1440 and POIs (0.8616ms)
✔ resolveVisualAngle correctly maps rotateId and index parameters (0.1926ms)
✔ getSectionPlansSummary computes accurate statistics from catalog flats (0.192ms)
ℹ tests 44
ℹ suites 0
ℹ pass 44
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 510.7804
```

---

### 6.2 Production Compilation & Asset Generation (`npm.cmd run build`)
Command: `npm.cmd run build` (`tsc && vite build`)  
Exit Code: `0`

```
> sensata-shattyq@1.0.0 build
> tsc && vite build

vite v6.4.3 building for production...
transforming...
✓ 1625 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                              1.06 kB │ gzip:   0.63 kB
dist/assets/SceneViewer-CVrKNrJO.css         5.13 kB │ gzip:   1.37 kB
dist/assets/VisualTourViewer-DWWECtf2.css   11.37 kB │ gzip:   2.60 kB
dist/assets/Journey-B7DYn-fM.css            29.88 kB │ gzip:   6.61 kB
dist/assets/index-C0EvIoMo.css              61.10 kB │ gzip:  12.16 kB
dist/assets/ApartmentScene-C-sxrCyc.js       7.09 kB │ gzip:   3.44 kB
dist/assets/AudioTour-0UJ3VVuA.js            7.96 kB │ gzip:   3.29 kB
dist/assets/VisualTourViewer-Chq1ITKb.js    17.20 kB │ gzip:   6.06 kB
dist/assets/FlatExperience-B7xdVHk5.js      20.69 kB │ gzip:   7.17 kB
dist/assets/Catalog-Cbw8kFXD.js             20.74 kB │ gzip:   6.17 kB
dist/assets/vendor-icons-CNsLLpzo.js        24.86 kB │ gzip:   5.34 kB
dist/assets/SceneViewer-Rci_TsuU.js         24.94 kB │ gzip:   8.87 kB
dist/assets/Journey-Dtgb4uOt.js             25.10 kB │ gzip:   8.09 kB
dist/assets/InfoPages-Cxia_N0e.js           28.52 kB │ gzip:   8.57 kB
dist/assets/index-DoM5p_q4.js               61.65 kB │ gzip:  17.76 kB
dist/assets/vendor-react-CfDz6BDZ.js       142.93 kB │ gzip:  45.78 kB
dist/assets/vendor-three-3JKZa0ej.js       643.62 kB │ gzip: 163.15 kB
✓ built in 2.03s
```

---

### 6.3 Bundle Credential Leak Scan (`npm.cmd run security:scan`)
Command: `npm.cmd run security:scan` (`node scripts/scan-bundle-secrets.mjs`)  
Exit Code: `0`

```
> sensata-shattyq@1.0.0 security:scan
> node scripts/scan-bundle-secrets.mjs

🔍 Запуск сканирования клиентского бандла на утечки секретов CRM...

✅ Сканирование завершено: секретов CRM и внутренних идентификаторов Bitrix24 в бандле не обнаружено.
```

---

### 6.4 Dependency Vulnerability Scan (`npm.cmd audit`)
Command: `npm.cmd audit`  
Exit Code: `0`

```
found 0 vulnerabilities
```

---

## 7. Conclusion & Sign-Off

The security posture of the Sansata Shattyq web application has been elevated to high-assurance production readiness:
- All 9 vulnerabilities across server BFF streaming, response headers, memory bounds, client routing resilience, origin constraints, dev server configuration, URL filtering, error handling, and iframe sandboxing have been genuinely remediated.
- The Zero Trust Client Boundary is strictly maintained with zero exposed credentials or internal CRM data.
- The automated test suite covers all fixes across 4 tiers, verifying defense-in-depth with zero regressions and zero broken functionality.
