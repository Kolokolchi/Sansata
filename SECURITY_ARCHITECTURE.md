# Sansata Security Architecture & Trust Boundaries

**Project**: Sansata Real-Estate Web Application & BFF  
**Target Root**: `d:\Anti-Gravity\Sansata`  
**Classification Mode**: Evidence-Based Security Architecture (Requirement R1)  
**Verification Date**: 2026-09-18  

---

## 1. Architectural Overview & System Model

The Sansata Shattyq system employs a decoupled, layered architecture comprising a client-side Single Page Application (React 18, Three.js), a hardened Backend-for-Frontend (BFF) implemented using native Node.js HTTP (`node:http`), local append-only NDJSON storage, and an outbound REST adapter integrating with Bitrix24 CRM.

The security architecture strictly enforces the **Zero Trust Client Boundary**: the client web browser is treated as entirely untrusted and is strictly isolated from direct interaction with the CRM. All sensitive operations, credentials, data transformations, and validation occur within trusted server-side execution boundaries.

---

## 2. Five-Zone Trust Boundary Model

The system operates across five distinct security zones separated by four defensive trust boundaries:

```
[ ZONE 1: Client Web Browser (UNTRUSTED) ]
   │
   │ HTTPS / JSON Fetch
   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TRUST BOUNDARY 1: Perimeter Guard (Node HTTP Server & API Router)      │
│ • Origin / CORS Verification (checkOrigin)                             │
│ • Content-Type Enforcement (application/json)                          │
│ • Payload Size Ceiling (Stream aborted at > 8,192 bytes / 8 KB)        │
│ • Prototype Pollution Guard (__proto__, constructor, prototype)        │
│ • Client IP Determination (Direct socket vs TRUST_PROXY XFF)          │
│ • In-Memory Sliding Window Rate Limiting (Bounded 10,000 / FIFO)       │
│ • Anti-Spam Honeypot Detection (website field -> silent 200 OK)        │
│ • Idempotency Deduplication (requestId + SHA-256 fingerprint)          │
│ • Defensive HTTP Headers (CSP, nosniff, DENY, same-origin, etc.)       │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Validated & Sanitized Data
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TRUST BOUNDARY 2: Application Service (Trusted BFF)                    │
│ • Strict Allowlist Schema Validation (validateLead, validateBooking)   │
│ • E.164 Phone Normalization (+7XXXXXXXXXX)                             │
│ • String Sanitization (Length bounds, regex exclusion of <>\x00-\x1f)  │
│ • Broken Object Level Authorization (BOLA) Check (reject sold units)   │
│ • Apartment Status Cache Aggregation & Negative Caching Cooldown       │
│ • Local File Persistence (.local/*.ndjson with strict mode 0o600)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Internal Request DTO
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TRUST BOUNDARY 3: Internal Service Adapter (BitrixAdapter Boundary)    │
│ • Credential Encapsulation (BITRIX_WEBHOOK_URL strictly server-side)   │
│ • SSRF Protection (block 169.254.169.254, GCP metadata, instance-data) │
│ • Strict Outbound Protocol Restriction (https: enforced in prod)       │
│ • Hard Request Timeout (AbortSignal.timeout(5000))                     │
│ • Response Sanitization: Total excision of internal Bitrix IDs & CRM   │
│   fields before returning public UUIDs to the caller                   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS POST (TLS 1.2 / 1.3)
                                   ▼
[ ZONE 5: External CRM Service (Bitrix24 Cloud CRM) ]
  • crm.lead.add.json
  • crm.deal.add.json
  • crm.item.list.json
```

---

## 3. Trust Boundary Specifications

### Zone 1: Client Web Browser (Untrusted Zone)
- **Execution Context**: Prospective buyer's web browser running React 18, Three.js WebGL canvas, and SVG geometry viewers.
- **Threat Model**: Hostile or compromised user agents, automated spam bots, web scrapers, malicious extensions, and DOM tampering.
- **Contract**: Zero Trust. Any parameter, query string, HTTP header, or request body originating from Zone 1 is assumed to be potentially malicious and must be strictly validated before processing.
- **Client Protections**:
  - React 18 JSX text escaping prevents DOM XSS.
  - Third-party Luma 3D tour iframes are sandboxed with `sandbox="allow-scripts allow-same-origin"` (`src/features/SceneViewer.tsx:956`).
  - Client-side navigation (`src/lib/site.ts:navigateTo`) strictly drops `javascript:`, `data:`, `vbscript:`, and protocol-relative `//` URLs.
  - Route parameter decoding (`src/features/ExperienceRoutes.tsx:safeDecode`) wraps `decodeURIComponent` in a safe try/catch to prevent unhandled `URIError` crashes on malformed percent sequences.
  - Lead submission endpoint (`src/lib/config.ts:isValidLeadEndpoint`) is restricted to local relative paths (`/api/*`), preventing configuration-based data exfiltration.

---

### Boundary 1: Perimeter Guard (`server/index.mjs` & `server/apiRouter.mjs`)
The Perimeter Guard forms the outer defensive shell of the Node.js BFF.

1. **Origin Verification & CORS (`server/apiRouter.mjs:66-92`)**:
   - Compares the `Origin` header against `process.env.ALLOWED_ORIGIN`.
   - In the absence of `ALLOWED_ORIGIN`, enforces same-origin policy by comparing origin host with `req.headers.host` (or allows `localhost` / `127.0.0.1`).
   - Unauthorized cross-origin requests receive immediate `403 Forbidden` (`{"error": "Недопустимый источник запроса (CORS)."}`).
   - Preflight `OPTIONS` requests return `204 No Content` with `Access-Control-Allow-Methods: GET, POST, OPTIONS` and `Access-Control-Max-Age: 86400`. `Access-Control-Allow-Credentials` is strictly omitted.

2. **Content-Type Enforcement (`server/apiRouter.mjs:176, 290`)**:
   - `POST` endpoints require `Content-Type: application/json`. Non-conforming content types immediately return `415 Unsupported Media Type`.

3. **Streaming Payload Size Limiting (`server/apiRouter.mjs:23-35`)**:
   - Incoming request streams are monitored chunk-by-chunk.
   - If accumulated bytes exceed 8,192 bytes (8 KB), the readable stream is aborted, destroyed, and returned as `413 Payload Too Large`.

4. **Prototype Pollution Guard (`server/apiRouter.mjs:51-58`)**:
   - Request bodies are parsed and inspected for own properties named `__proto__`, `constructor`, or `prototype`.
   - Any match terminates request evaluation immediately with `400 Bad Request`.

5. **Client IP Resolution (`server/leads.mjs:123-134`)**:
   - Defaults strictly to the kernel socket address (`req.socket.remoteAddress`).
   - `X-Forwarded-For` is parsed ONLY if `process.env.TRUST_PROXY === 'true'`.
   - When parsed, the leftmost IP is validated against `/^[0-9a-fA-F:.]+$/` with length <= 45.

6. **Sliding Window Rate Limiting (`server/rateLimiter.mjs:5-67`)**:
   - Dedicated instances per functional boundary:
     - `/api/leads` and `/api/lead`: 3 requests per 10 minutes per IP.
     - `/api/booking`: 3 requests per 10 minutes per IP.
     - `/api/apartments/status`: 60 requests per 1 minute per IP.
   - Bounded memory footprint: capped at 10,000 entries. When capacity is reached, expired entries are cleaned; if still full, strict FIFO eviction of the oldest entry is executed.
   - Rate limit violations return `429 Too Many Requests` with a numeric `Retry-After: <seconds>` header.

7. **Anti-Spam Honeypot Trap (`server/apiRouter.mjs:184-192, 298-306`)**:
   - The frontend renders an invisible field: `<input name="website" tabIndex={-1} autoComplete="off" />` (`src/features/LeadForm.tsx:155`).
   - If `body.website` is non-empty, the Perimeter Guard returns HTTP `200 OK` with a synthetic UUID (`{"success": true, "ok": true, "id": "<random-uuid>"}`).
   - The payload is silently discarded: **zero** writes to disk and **zero** calls to the CRM. The bot's rate limit quota is consumed, neutralizing automated campaigns.

8. **Idempotency & Request Deduplication (`server/apiRouter.mjs:105-135, 200-212`)**:
   - Clients supply an optional `requestId` (UUID or client-generated hash).
   - The BFF stores requests in a bounded Map (`MAX_RECEIVED_REQUESTS = 10000`) keyed by `${ip}:${requestId}`.
   - If an identical payload arrives within 1 hour, the cached 200 response is returned.
   - If the payload differs, the request is rejected with `409 Conflict`.
   - When map capacity reaches 10,000, FIFO eviction purges the oldest entry.

9. **Defensive HTTP Security Headers (`server/index.mjs:26-34`)**:
   - All static and API responses emit:
     - `Content-Security-Policy`: Restrictive policy permitting self assets, Three.js blob textures, HTTPS images/data, and Luma 3D tour embeds (`frame-src https://lumalabs.ai https://*.lumalabs.ai`).
     - `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
     - `X-Frame-Options: DENY`: Prevents UI redressing / clickjacking.
     - `Referrer-Policy: strict-origin-when-cross-origin`: Restricts cross-origin referrer leakage.
     - `Permissions-Policy: geolocation=(), camera=(), microphone=()`: Blocks browser sensor access.
     - `Cross-Origin-Opener-Policy: same-origin`: Isolates the top-level browsing context.

---

### Boundary 2: Application Service (Trusted BFF) (`server/leads.mjs`, `server/statusCache.mjs`)
The Application Service handles business validation, data normalization, and persistence.

1. **Strict Allowlist Schema Validation (`server/leads.mjs:18-115`)**:
   - Every input field is validated against an exact allowlist:
     - `name`: String, trimmed length 2–80 chars, regex `^[a-zA-Zа-яА-ЯёЁәіңғүұқөһӘІҢҒҮҰҚӨҺ\s\-.]+$`, no control characters `[\x00-\x1f]`.
     - `phone`: Cleaned digits must match `/^[78]\d{10}$/`. Normalized to E.164 format `+7XXXXXXXXXX`.
     - `consent`: Boolean, must strictly equal `true`.
     - `topic`: Optional string, max 600 chars, no `<>`, no control characters.
     - `apartmentId`: Optional string, regex `/^[a-zA-Z0-9_-]{1,64}$/`.
     - `apartmentNumber`: Optional string, regex `/^[0-9a-zA-Z\s-]{1,20}$/`.
   - **Mass Assignment Defense**: Any unexpected property (e.g. `role`, `admin`, `priceOverride`, `UF_CRM_*`) results in immediate `400 Bad Request` rejection.

2. **Broken Object Level Authorization (BOLA) Check (`server/apiRouter.mjs:316-322`)**:
   - On apartment booking (`POST /api/booking`), the requested `apartmentId` is cross-referenced with `statusCache`.
   - If the apartment is currently marked as `sold`, the booking is rejected with `409 Conflict` (`{"error": "Данная квартира уже продана."}`).

3. **Status Aggregation & Caching (`server/statusCache.mjs:31-99`)**:
   - Serves cached apartment statuses (`available`, `reserved`, `sold`) with a 5-minute TTL.
   - Throttles upstream CRM load with negative caching (30s cooldown on failure) and stampede protection (single active fetch promise).

4. **Local Append-Only NDJSON Storage (`server/apiRouter.mjs:234-248, 358-372`)**:
   - Leads and bookings are persisted to `.local/leads.ndjson` and `.local/bookings.ndjson`.
   - Newlines are strictly escaped via `JSON.stringify()`.
   - Files are written with permission mode `0o600` (readable and writable exclusively by the service process owner).

---

### Boundary 3: Internal Service Adapter (`server/bitrixAdapter.mjs`)
The Bitrix Adapter manages outbound communication with the external CRM.

1. **Credential Isolation**:
   - The Bitrix webhook URL (`process.env.BITRIX_WEBHOOK_URL`) and deal category (`process.env.BITRIX_DEAL_CATEGORY_ID`) are accessed exclusively within `BitrixAdapter`.
   - These values are never exported, never logged, never exposed to Vite client defines, and never included in API responses.

2. **Server-Side Request Forgery (SSRF) Defense (`server/bitrixAdapter.mjs:16-40`)**:
   - Validates that the webhook URL parses as a valid WHATWG URL.
   - Protocol check: Requires `https:` in production environments. `http:` is strictly restricted to `127.0.0.1` and `localhost` for local mock tests.
   - Cloud Metadata Protection: Explicitly rejects requests to:
     - `169.254.169.254` (AWS, Azure, DigitalOcean instance metadata service)
     - `metadata.google.internal` (Google Cloud Platform metadata service)
     - Hostnames containing `instance-data`
   - Placeholder URL detection: Automatically deactivates live CRM calls if the URL contains `your-domain.bitrix24.ru` or `secret_token`.

3. **Outbound Network Timeouts (`server/bitrixAdapter.mjs:76, 130, 165`)**:
   - All outbound `fetch()` requests enforce `signal: AbortSignal.timeout(5000)`.
   - Prevents slowloris-style thread or socket starvation if the CRM endpoint degrades.

4. **Response DTO Scrubbing & Zero Leakage (`server/bitrixAdapter.mjs:85-90, 139-144`)**:
   - Raw Bitrix API responses (which return internal numerical IDs like `{"result": 49201}`) are discarded.
   - The adapter returns exclusively:
     ```javascript
     {
       success: true,
       leadId: crypto.randomUUID(),
       message: 'Заявка принята.'
     }
     ```
   - No Bitrix Deal IDs, Lead IDs, user IDs, or custom CRM fields (`UF_CRM_*`) ever leave the server boundary.

---

### Zone 5: External CRM Service (Bitrix24 Cloud)
- External third-party SaaS endpoint communicating over TLS 1.2/1.3.
- Receives sanitized lead inquiries via `crm.lead.add.json` and deals via `crm.deal.add.json`.
- Supplies raw apartment lot status lists via `crm.item.list.json`.

---

## 4. End-to-End Data Flows

### Flow 1: Consultation Lead Submission (`POST /api/leads`)
1. User enters name, phone, and optional topic in `LeadForm.tsx`.
2. Client generates a random UUID `requestId` and submits JSON to relative `/api/leads`.
3. **Perimeter Guard**:
   - Validates `Origin` header.
   - Checks `Content-Type: application/json`.
   - Verifies request body <= 8,192 bytes.
   - Inspects for prototype pollution (`__proto__`, `constructor`, `prototype`).
   - Resolves client IP and checks rate limit bucket (3 req / 10 min).
   - Evaluates honeypot field (`website`): if present, returns 200 OK silently.
   - Checks idempotency cache for `${ip}:${requestId}`.
4. **Application Service**:
   - Validates schema: name (2-80 chars), phone (Kazakh/Russian format), consent (true).
   - Normalizes phone to `+7XXXXXXXXXX`.
   - Writes record to `.local/leads.ndjson` (mode `0o600`).
5. **Bitrix Adapter**:
   - Formats outbound payload: `TITLE: 'Заявка с сайта (Шаттық)'`, `NAME`, `PHONE`, `COMMENTS`.
   - Dispatches HTTPS POST to `BITRIX_WEBHOOK_URL/crm.lead.add.json` with 5s timeout.
   - Discards internal numeric ID; generates fresh UUID `leadId`.
6. Client receives `201 Created`: `{"success": true, "leadId": "<uuid>", "message": "Заявка принята."}`.

### Flow 2: Apartment Booking Request (`POST /api/booking`)
1. User clicks "Забронировать" on an apartment modal and fills the booking form.
2. Client submits JSON with `name`, `phone`, `apartmentId`, `apartmentNumber`, `consent`, `requestId`.
3. **Perimeter Guard** executes same security pipeline as Flow 1.
4. **Application Service**:
   - BOLA Check: Queries `statusCache` for `apartmentId`. If status is `sold`, halts flow and returns `409 Conflict`.
   - Normalizes phone and validates all fields.
   - Appends booking to `.local/bookings.ndjson`.
5. **Bitrix Adapter**:
   - Submits deal to Bitrix `crm.deal.add.json` within configured `CATEGORY_ID`.
   - Discards internal deal ID; returns clean public UUID `bookingId`.
6. Client receives `201 Created`: `{"success": true, "bookingId": "<uuid>", "message": "Заявка на бронирование принята."}`.

### Flow 3: Apartment Status Feed (`GET /api/apartments/status`)
1. Client visualizer queries `/api/apartments/status` to render real-time availability colors.
2. **Perimeter Guard**: Verifies GET method, origin, and rate limit (60 req / 1 min).
3. **Status Cache**:
   - Returns in-memory cache if younger than 5 minutes.
   - If expired, fetches `crm.item.list.json` from Bitrix24.
   - **Sanitization**: Filters all items through `getPublicApartmentId()`. Only keys matching `/^shattyq-[a-zA-Z0-9_-]{1,64}$/` or `/^s\d+-f\d+-u\d+$/` are admitted. All numeric IDs (`item.id`) are stripped.
4. Client receives `200 OK` with sanitized mapping:
   ```json
   {
     "updatedAt": "2026-09-18T02:50:00.000Z",
     "statuses": {
       "shattyq-1": "available",
       "shattyq-2": "reserved"
     }
   }
   ```

### Flow 4: Static Asset & SPA Serving (`GET /*`)
1. User requests static assets (`.js`, `.css`, `.glb`, `.png`) or SPA routes (`/`, `/flat/:id`).
2. **Static Server (`server/index.mjs`)**:
   - Enforces `GET` / `HEAD` methods.
   - Decodes URI and validates percent-encoding.
   - Enforces dotfile blocking: any segment starting with `.` returns `403 Access denied`.
   - Confines path within `dist/` directory via `file.startsWith(root + sep)`.
   - Attaches `.on('error')` listener to `createReadStream.pipe(res)` to prevent unhandled process crashes (SEC-01).
   - Emits security headers including `Content-Security-Policy` (SEC-02).
   - Serves requested file or falls back to `dist/index.html` for client-side SPA routing.

---

## 5. Error Handling Architecture

The security architecture mandates strict error isolation:
1. **Zero Stack Trace Exposure**: No server error stack traces, internal file paths, or module resolution errors are ever returned in HTTP responses.
2. **Curated User Error Messages**: All client responses provide localized, user-facing error strings in Russian (e.g. `{"error": "Некорректный JSON запрос."}`, `{"error": "Данная квартира уже продана."}`).
3. **CRM Failure Shielding**: If Bitrix24 is unreachable or returns HTTP errors, the BFF logs the error server-side and responds with generic messaging (`"CRM временно недоступна."`), preventing information leakage about upstream CRM architecture.
4. **Stream Read Error Handling**: If an I/O read failure occurs while streaming static files, the stream is cleanly destroyed and an HTTP 500 JSON response (`{"error": "Server error"}`) is emitted if headers have not yet been sent, avoiding broken HTTP pipelining.
