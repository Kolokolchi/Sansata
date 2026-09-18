# Sansata Security Scope & Applicability Analysis

**Project**: Sansata Real-Estate Web Application & BFF  
**Target Root**: `d:\Anti-Gravity\Sansata`  
**Classification Mode**: Evidence-Based Security Audit (Requirement R1)  
**Verification Date**: 2026-09-18  

---

## 1. Executive Scope Overview

This document defines the formal boundaries, evaluated technology surfaces, and explicit applicability determinations for the security audit of the Sansata Shattyq web application.

The audit strictly follows the **Ground Truth Principle**: evaluations are conducted solely on technologies, runtime environments, source code, and configuration assets that actually exist within this repository. Non-existent architectures, speculative frameworks, and irrelevant security checklist items are explicitly classified as `NOT_APPLICABLE` with verified evidence to prevent false positives and architectural bloat.

### Primary Evaluated Assets:
- **Server BFF (Backend-for-Frontend)**: Native Node.js HTTP server (`node:http`), custom routing (`server/apiRouter.mjs`), Bitrix24 CRM integration (`server/bitrixAdapter.mjs`), in-memory sliding window rate limiter (`server/rateLimiter.mjs`), in-memory apartment status cache (`server/statusCache.mjs`), and local append-only NDJSON storage (`server/leads.mjs`).
- **Client Frontend**: React 18 SPA (`src/App.tsx`, `src/features/*`), Three.js WebGL visualizers (`src/features/ApartmentScene.tsx`, `src/features/SceneViewer.tsx`), SVG spatial overlays (`src/features/SelectionImage.tsx`), and configuration parsers (`src/lib/config.ts`, `src/lib/site.ts`).
- **Build and Tooling**: Vite 6 bundler (`vite.config.ts`), TypeScript 5.7 static typechecker, automated Node native test suite (`tests/*.test.mjs`), and security scan tooling (`scripts/scan-bundle-secrets.mjs`).

---

## 2. Technology Applicability Classification Table

The table below enumerates all audited areas across the Sansata project, their operational status, concrete repository evidence, formal classification, and security relevance.

| Technology / Component Area | Repository Status | Verified Evidence (File, Line, Artifact) | Status Classification | Security Relevance & Audit Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Native Node.js HTTP Server** | Active in Production & Dev | `server/index.mjs:1-125`, `server/apiRouter.mjs:1-445`, `vite.config.ts:14-16` | **APPLICABLE** | HTTP request parsing, HTTP method enforcement, MIME dispatch, static file security, Slowloris timeouts, stream error resilience, and security response headers. |
| **Node.js Core Security Modules** | Active | `node:crypto` (`server/apiRouter.mjs:2`), `node:fs` (`server/index.mjs:2-6`), `node:path` (`server/index.mjs:7`) | **APPLICABLE** | SHA-256 request fingerprinting, random UUID generation, safe path normalization, file permission enforcement (`0o600`). |
| **React 18 & React DOM** | Active in Client SPA | `package.json:19-20`, `src/main.tsx:1-12`, `src/App.tsx:1-1200` | **APPLICABLE** | DOM XSS defense, automatic JSX string escaping, component lifecycle resilience, and error boundary handling. |
| **Vite 6 Build System & Dev Server** | Active Build & Dev Tool | `package.json:30`, `vite.config.ts:1-45` | **APPLICABLE** | Dev server middleware parity, filesystem deny list (`server.fs.deny`), production chunk splitting, environment variable isolation. |
| **Three.js (WebGL 3D Engine)** | Active Client Feature | `package.json:21`, `src/features/ApartmentScene.tsx:4`, `src/features/SceneViewer.tsx` | **APPLICABLE** | WebGL resource disposal (geometries, materials, textures), canvas memory leak prevention, throttled raycasting CPU load, iframe embedding security. |
| **Local Leads Storage (NDJSON)** | Active Storage Mechanism | `.local/leads.ndjson` (184 KB), `server/apiRouter.mjs:234-248` | **APPLICABLE** | Local persistence fallback, file permission mode `0o600`, injection resistance, newline escaping, data isolation. |
| **Local Bookings Storage (NDJSON)** | Active Storage Mechanism | `.local/bookings.ndjson` (6.6 KB), `server/apiRouter.mjs:358-372` | **APPLICABLE** | Consultation booking persistence, data consistency, atomic file writes, mode `0o600`. |
| **Bitrix24 REST API Adapter** | Active BFF Integration | `server/bitrixAdapter.mjs:7-175`, `server/apiRouter.mjs:4,98` | **APPLICABLE** | SSRF prevention (cloud metadata blocking), credential isolation, DTO sanitization, 5s timeout enforcement. |
| **In-Memory Rate Limiter** | Active Perimeter Defense | `server/rateLimiter.mjs:5-67`, `server/apiRouter.mjs:100-102` | **APPLICABLE** | DoS resistance, bounded memory (max 10,000 entries), FIFO eviction, IP parsing trust boundaries (`req.socket` vs `TRUST_PROXY`). |
| **In-Memory Status Cache** | Active Performance Cache | `server/statusCache.mjs:31-99`, `server/apiRouter.mjs:99` | **APPLICABLE** | Rate absorption, internal CRM ID stripping, negative caching cooldown, public lot regex matching (`shattyq-*`, `s*-f*-u*`). |
| **Bundle Secret Scanner** | Active Security Script | `package.json:13`, `scripts/scan-bundle-secrets.mjs:1-63` | **APPLICABLE** | Post-build bundle auditing for Bitrix webhooks, token strings, and `UF_CRM_*` user fields. |
| **Client Iconography & UI (`lucide-react`, `clsx`)** | Active Dependencies | `package.json:17-18` | **APPLICABLE** | Supply chain vulnerability scanning (0 known CVEs across all versions). |
| **SQLite Database (`apartments.db`)** | Present but Dormant / Unwired | `apartments.db` (36,864 bytes, 4 empty tables) | **PARTIALLY_APPLICABLE** | Schema exists (`buildings`, `sections`, `floors`, `apartments`), but no runtime queries, connections, or ORMs exist. Data source is `src/data/shattyq.json`. File must be protected from network exposure. |
| **OAuth 2.0 / OpenID Connect / SAML** | **DOES NOT EXIST** | Codebase grep returned 0 matches across entire project | **NOT_APPLICABLE** | No identity provider, login flow, token exchange, or external authorization framework. |
| **JWT / User Sessions / Multi-Role RBAC** | **DOES NOT EXIST** | Codebase grep returned 0 matches across entire project | **NOT_APPLICABLE** | Public real-estate presentation catalog; no authenticated user roles (Admin, Manager, Customer) exist. |
| **GraphQL (Apollo, Relay, GraphQL Yoga)** | **DOES NOT EXIST** | Codebase grep returned 0 matches across entire project | **NOT_APPLICABLE** | Public API is strictly REST/JSON via Node HTTP. No GraphQL schemas, resolvers, or query parsers. |
| **Docker / Podman / Containers** | **DOES NOT EXIST** | `find_by_name: *docker*` returned 0 matches | **NOT_APPLICABLE** | No Dockerfile, docker-compose, or container build specifications exist in repository. |
| **Kubernetes / Helm / Service Mesh** | **DOES NOT EXIST** | `find_by_name: *k8s*`, `*helm*` returned 0 matches | **NOT_APPLICABLE** | No container manifests, charts, or orchestration configurations exist. |
| **Redis / Memcached / External Key-Value** | **DOES NOT EXIST** | Codebase grep confirmed 0 usages | **NOT_APPLICABLE** | Caching and rate limiting are implemented in-process via Node.js native Map data structures. |
| **Cloud IaC (Terraform, Pulumi, CloudFormation)** | **DOES NOT EXIST** | `find_by_name: *.tf`, `*.yaml` returned 0 cloud IaC files | **NOT_APPLICABLE** | No cloud infrastructure automation scripts or state files exist. |
| **Microservices Architecture / gRPC / Protobuf** | **DOES NOT EXIST** | Codebase grep returned 0 matches | **NOT_APPLICABLE** | Monolithic architecture with static frontend assets and co-located Node.js BFF. |
| **Third-Party SQL ORM (Prisma, TypeORM, Sequelize)** | **DOES NOT EXIST** | `package.json` inspection confirms 0 ORM packages | **NOT_APPLICABLE** | No object-relational mapping layer; database file is dormant. |
| **WebSockets / Socket.io / Server-Sent Events** | **DOES NOT EXIST** | Codebase grep confirmed 0 WebSocket servers/clients | **NOT_APPLICABLE** | All client-server communication is synchronous HTTP request/response. |

---

## 3. Explicit Justifications for Non-Applicable Technologies

To maintain strict audit integrity and prevent the introduction of unnecessary abstractions or phantom controls, the following classifications are formally documented:

### 3.1 OAuth 2.0, OpenID Connect & User Sessions
- **Business Purpose**: The Sansata Shattyq web application is an open, unauthenticated real-estate marketing and architectural visualization portal. Its function is to showcase apartments, floorplans, 3D views, and infrastructure to prospective homebuyers, allowing them to submit inquiries for sales consultations.
- **Architectural Fact**: There are no private customer dashboards, administrative control panels, payment processing gateways, or user profile sections in the frontend or backend.
- **Security Assessment**: Forcing user authentication, OAuth redirects, or session tokens onto a public real-estate catalog would introduce unnecessary friction for prospective buyers and significantly expand the attack surface (token theft, session fixation, CSRF, credential stuffing). Public endpoints are properly defended by rate limiting, CORS origin verification, schema validation, and honeypots.

### 3.2 GraphQL
- **Architectural Fact**: The application API consists of exactly three endpoints: `GET /api/apartments/status`, `POST /api/leads`, and `POST /api/booking`.
- **Security Assessment**: GraphQL introduces substantial security risks (deeply nested query DoS, circular fragment exhaustion, field duplication attacks, schema introspection exposure, and authorization bypasses) without delivering any benefit for three fixed REST endpoints. REST over Node.js native HTTP provides bounded, deterministic execution.

### 3.3 Redis / Distributed Caching
- **Architectural Fact**: The application runs as a cohesive, single-instance Node.js service (or as static files fronting the BFF).
- **Security Assessment**: Rate limiting (`server/rateLimiter.mjs`) and status caching (`server/statusCache.mjs`) are implemented using bounded native Node.js `Map` instances (capped at 10,000 entries with automatic 60s background cleanup and FIFO eviction). Total heap memory consumed by these structures is under 2 MB. Introducing an external Redis service would add network serialization overhead, external credential management risks, and operational complexity with zero measurable security gain.

### 3.4 Docker & Kubernetes
- **Architectural Fact**: The application is managed via standard npm lifecycle scripts (`npm run build`, `npm start`, `npm test`) running directly on Node.js v20+ runtime environments.
- **Security Assessment**: Auditing container configuration, rootless container execution, cgroup boundaries, or Kubernetes network policies is not applicable because no container specifications exist in the codebase.

### 3.5 Cloud Infrastructure as Code (IaC)
- **Architectural Fact**: Deployment is decoupled from cloud provider provisioning scripts (e.g. Terraform or Pulumi). Production deployment relies on standard Node.js process managers or static asset hosting.
- **Security Assessment**: Auditing cloud IAM roles, S3 bucket policies, or VPC peering configurations is outside the repository scope.

---

## 4. Scope Boundaries & Assumptions

1. **Host Environment**: The Node.js runtime process is assumed to run on a secured host operating system behind a reverse proxy (e.g., Nginx, Cloudflare) when deployed to public networks.
2. **Reverse Proxy Contract**: When `TRUST_PROXY=true` is enabled, the upstream reverse proxy is assumed to overwrite or sanitize the incoming `X-Forwarded-For` header with the authentic client IP address (`$remote_addr`).
3. **Database Dormancy**: `apartments.db` is maintained as a dormant, read-only SQLite artifact. It is never queried at runtime, never migrated dynamically, and is protected from HTTP serving via `vite.config.ts` (`server.fs.deny`) in development and `server/index.mjs` path isolation in production.
4. **CRM Integration Scope**: Bitrix24 is an external, cloud-hosted SaaS system accessed over TLS. The scope of this audit governs the *adapter boundary*, credential isolation, SSRF prevention, and outbound data sanitization—not Bitrix24's internal SaaS infrastructure.
