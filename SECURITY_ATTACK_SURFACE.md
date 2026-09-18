# Sansata Public Attack Surface & Interface Inventory

**Project**: Sansata Real-Estate Web Application & BFF  
**Target Root**: `d:\Anti-Gravity\Sansata`  
**Classification Mode**: Evidence-Based Attack Surface Mapping (Requirement R1)  
**Verification Date**: 2026-09-18  

---

## 1. Attack Surface Overview

The public attack surface of the Sansata Shattyq system consists of:
1. **Public API Endpoints**: Three functional JSON routes exposed via the Node.js Backend-for-Frontend (BFF).
2. **Static Asset & SPA Serving**: Native Node.js file serving delivering compiled client bundles, 3D assets, and SPA route fallbacks.
3. **Client-Side Form Interfaces**: User-facing interactive forms for general sales consultations and specific apartment booking requests.

All public endpoints are accessible without authentication, reflecting the application's nature as an open marketing catalog for real-estate buyers. Security is enforced through strict perimeter controls, origin filtering, rate limiting, stream size bounds, schema allowlists, and anti-bot traps.

---

## 2. Comprehensive Endpoint Inventory

| Endpoint | Method | Access Level | Payload Format | Key Headers | Rate Limit | Body Limit | Response Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/apartments/status` | `GET` | Public / Unauth | None | `Origin` | 60 req / 60s per IP | N/A | `200`, `403`, `405`, `429` |
| `/api/apartments/status` | `OPTIONS` | Public / Unauth | None | `Origin`, `Access-Control-Request-Method` | None | N/A | `204`, `403` |
| `/api/leads` | `POST` | Public / Unauth | JSON body | `Content-Type: application/json`, `Origin`, `X-Request-ID` | 3 req / 10 min per IP | 8,192 bytes (8 KB) | `200`, `201`, `400`, `403`, `405`, `409`, `413`, `415`, `429`, `500` |
| `/api/leads` | `OPTIONS` | Public / Unauth | None | `Origin` | None | N/A | `204`, `403` |
| `/api/lead` *(alias)* | `POST` | Public / Unauth | JSON body | `Content-Type: application/json`, `Origin`, `X-Request-ID` | 3 req / 10 min per IP (shared) | 8,192 bytes (8 KB) | Identical to `/api/leads` |
| `/api/lead` *(alias)* | `OPTIONS` | Public / Unauth | None | `Origin` | None | N/A | `204`, `403` |
| `/api/booking` | `POST` | Public / Unauth | JSON body | `Content-Type: application/json`, `Origin`, `X-Request-ID` | 3 req / 10 min per IP | 8,192 bytes (8 KB) | `200`, `201`, `400`, `403`, `405`, `409`, `413`, `415`, `429`, `500` |
| `/api/booking` | `OPTIONS` | Public / Unauth | None | `Origin` | None | N/A | `204`, `403` |
| `/*` (Static & SPA) | `GET`, `HEAD` | Public / Unauth | URL Path | `Range`, `If-Modified-Since` | OS socket bounds | N/A | `200`, `206`, `400`, `403`, `404`, `405`, `500` |

---

## 3. Deep-Dive Endpoint Specifications & Defense Mechanisms

### 3.1 `GET /api/apartments/status`
- **Location**: `server/apiRouter.mjs:140-155`
- **Purpose**: Supplies the interactive floorplans and catalog with current unit availability statuses (`available`, `reserved`, `sold`).
- **Allowed Methods**: `GET`, `OPTIONS`. Any other HTTP method (e.g., `POST`, `PUT`, `DELETE`) is rejected with `405 Method Not Allowed` and header `Allow: GET, OPTIONS`.
- **CORS Verification**:
  - `Origin` header is inspected via `checkOrigin(req)` (`server/apiRouter.mjs:66-92`).
  - Matches `process.env.ALLOWED_ORIGIN` or the host header for same-origin requests.
  - Invalid origins receive `403 Forbidden`.
- **Rate Limiter**:
  - Managed by `statusLimiter` (`RateLimiter(60, 60000)`).
  - Enforces a quota of 60 requests per 60 seconds per client IP.
  - Excess requests receive `429 Too Many Requests` with a numeric `Retry-After: <seconds>` header.
- **Cache Management**:
  - Served from `StatusCache` (`server/statusCache.mjs`).
  - In-memory cache TTL of 5 minutes; negative TTL of 30 seconds on CRM fetch errors.
  - Thundering-herd / cache stampede protection: concurrent requests await the single in-flight fetch promise.
- **DTO Sanitization & CRM Scrubbing**:
  - Raw CRM item lists are filtered through `getPublicApartmentId(item)`.
  - Only keys matching `/^shattyq-[a-zA-Z0-9_-]{1,64}$/i` or `/^s\d+-f\d+-u\d+$/i` are included in `statuses`.
  - All internal numeric IDs (e.g. `item.id = 49201`), deal titles, and `UF_CRM_*` custom fields are strictly purged.
- **Output DTO (`200 OK`)**:
  ```json
  {
    "updatedAt": "2026-09-18T02:50:00.000Z",
    "statuses": {
      "shattyq-1": "available",
      "shattyq-2": "reserved",
      "shattyq-3": "sold"
    }
  }
  ```

---

### 3.2 `POST /api/leads` (and `/api/lead`)
- **Location**: `server/apiRouter.mjs:157-269`
- **Purpose**: Ingestion endpoint for general customer sales consultation inquiries.
- **Allowed Methods**: `POST`, `OPTIONS`. Other methods return `405 Method Not Allowed`.
- **Perimeter Controls**:
  1. **Content-Type Check**: Requires `Content-Type: application/json`. Non-JSON requests return `415 Unsupported Media Type`.
  2. **Streaming Payload Ceiling**: Request body stream is read chunk-by-chunk up to 8,192 bytes. Exceeding 8 KB aborts the stream and returns `413 Payload Too Large`.
  3. **Prototype Pollution Guard**: JSON parser inspects keys for `__proto__`, `constructor`, or `prototype`. Matches trigger immediate `400 Bad Request`.
  4. **Rate Limiting**: `leadLimiter` enforces 3 requests per 10-minute window per IP. Exceeding quota returns `429 Too Many Requests` with `Retry-After`.
  5. **Anti-Spam Honeypot**: Inspects `body.website`. If non-empty, returns synthetic `200 OK` with generated UUID without persisting to disk or calling Bitrix.
  6. **Idempotency Deduplication**: Keyed by `${ip}:${requestId}`. Matches SHA-256 fingerprint; replays return cached response, while modified payloads return `409 Conflict`.
- **Validation Schema (`server/leads.mjs:18-64`)**:
  - `name` (required, string): Length 2–80 chars, trimmed. Must match Kazakh/Russian/English name pattern, excluding `< > \x00-\x1f`.
  - `phone` (required, string): Strips non-digits; must match `^[78]\d{10}$`. Normalized to `+7XXXXXXXXXX`.
  - `consent` (required, boolean): Must strictly equal `true`.
  - `topic` (optional, string): Max 600 chars. Defaults to `'Консультация'`. No control characters.
  - `apartmentId` (optional, string): Regex `^[a-zA-Z0-9_-]{1,64}$`.
  - `requestId` (optional, string): Regex `^[a-zA-Z0-9-]{8,80}$`.
  - `website` (optional, string): Honeypot trap string.
  - **Mass Assignment Rejection**: Any extra or unknown key (e.g. `role`, `admin`, `price`) triggers `400 Bad Request`.
- **Output DTO (`201 Created`)**:
  ```json
  {
    "success": true,
    "ok": true,
    "id": "e4b2d3c1-a8f5-4e78-9012-3456789abcde",
    "leadId": "e4b2d3c1-a8f5-4e78-9012-3456789abcde",
    "mode": "bitrix",
    "message": "Заявка принята."
  }
  ```

---

### 3.3 `POST /api/booking`
- **Location**: `server/apiRouter.mjs:271-393`
- **Purpose**: Consultation booking endpoint for specific apartment units selected in the visualizer.
- **Allowed Methods**: `POST`, `OPTIONS`. Other methods return `405 Method Not Allowed`.
- **Perimeter Controls**: Identical to `/api/leads` (CORS origin check, 8 KB body limit, prototype pollution rejection, 3 req / 10 min rate limit, honeypot handling, idempotency deduplication).
- **Validation Schema (`server/leads.mjs:68-115`)**:
  - Inherits all constraints from `/api/leads`.
  - `apartmentId` (optional, string): Regex `^[a-zA-Z0-9_-]{1,64}$`.
  - `apartmentNumber` (optional, string): Regex `^[0-9a-zA-Z\s-]{1,20}$`.
- **Broken Object Level Authorization (BOLA) Check (`server/apiRouter.mjs:316-322`)**:
  - Queries `statusCache` for `apartmentId`.
  - If the unit is currently marked as `sold`, the booking is rejected with `409 Conflict`:
    ```json
    {
      "error": "Данная квартира уже продана."
    }
    ```
- **Output DTO (`201 Created`)**:
  ```json
  {
    "success": true,
    "ok": true,
    "id": "f5c3e4d2-b9a6-4f89-0123-456789abcdef",
    "bookingId": "f5c3e4d2-b9a6-4f89-0123-456789abcdef",
    "mode": "bitrix",
    "message": "Заявка на бронирование принята."
  }
  ```

---

### 3.4 Static File Serving (`server/index.mjs`)
- **Location**: `server/index.mjs:26-125`
- **Purpose**: Delivers compiled production assets (`dist/`) and handles client-side SPA routing.
- **Allowed Methods**: `GET`, `HEAD`. Any other method returns `405 Method Not Allowed`.
- **Path Confinement & Traversal Protection**:
  - Path resolution: `file = resolve(root, '.' + pathname)`.
  - Jail check: `if (file !== root && !file.startsWith(root + sep)) return 403 Access denied`.
  - Prevents path traversal via `..` or symbolic links outside `dist/`.
- **Dotfile Protection**:
  - Inspects path segments: `pathname.split('/').some(segment => segment.startsWith('.'))`.
  - Any request targeting hidden files (e.g. `/.env`, `/.git`, `/.DS_Store`) immediately returns `403 Access denied`.
- **Malformed URI Handling**:
  - Wrapped in `try / catch`: invalid percent-encoded sequences (e.g. `/%80`) return `400 Bad Request`.
- **Stream Error Resilience (SEC-01)**:
  - Both range-request and full-file read streams (`createReadStream`) attach explicit `.on('error')` listeners.
  - If a read stream emits an error, the stream is destroyed; if headers were not sent, returns `500 Server error` JSON without crashing the Node.js process.
- **HTTP Range Requests**:
  - Supports `Range: bytes=start-end` headers with `206 Partial Content`, enabling efficient streaming of 3D `.glb` models and audio tour assets.
- **Defensive HTTP Security Headers (SEC-02)**:
  ```http
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https:; media-src 'self'; frame-src 'self' https://lumalabs.ai https://*.lumalabs.ai; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';
  Accept-Ranges: bytes
  ```
- **Slowloris DoS Defense**:
  - `server.headersTimeout = 5000` (5 seconds)
  - `server.requestTimeout = 10000` (10 seconds)
  - `server.keepAliveTimeout = 5000` (5 seconds)

---

## 4. Development Environment Attack Surface (`vite.config.ts`)

During local development (`npm run dev`), Vite serves frontend modules and proxies API requests:
- **Binding**: Configured with `host: true` (listens on `0.0.0.0:3000`).
- **Filesystem Deny Hardening (FE-03)**:
  ```typescript
  server: {
    port: 3000,
    host: true,
    fs: {
      deny: ['**/*.db', '**/.env*']
    }
  }
  ```
  Strictly blocks LAN attackers from downloading the local SQLite database (`apartments.db`) or secret environment files (`.env*`) over the development interface.
- **API Middleware Parity**: Mounts `server.middlewares.use(createApiRouter())` directly, ensuring identical rate limiting, validation, and honeypot security in development as in production.
