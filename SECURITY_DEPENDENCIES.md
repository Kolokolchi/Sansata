# Sansata Software Supply Chain & Dependency Security Audit

**Project**: Sansata Real-Estate Web Application & BFF  
**Target Root**: `d:\Anti-Gravity\Sansata`  
**Classification Mode**: Evidence-Based Dependency Audit (Requirement R2)  
**Verification Date**: 2026-09-18  

---

## 1. Executive Summary

An exhaustive security audit of the Sansata software supply chain was conducted using package manifest verification, lockfile subresource integrity inspection, and automated vulnerability scanning via `npm audit`.

### Audit Findings:
- **Total Packages in Dependency Graph**: 134 packages (9 production, 126 development, 53 optional).
- **Vulnerabilities Detected**: **0 vulnerabilities** (0 Critical, 0 High, 0 Moderate, 0 Low, 0 Info).
- **Runtime Attack Surface**: Extremely minimal. The production runtime relies on only 5 direct dependencies, with **zero external HTTP/web frameworks** (Express, Fastify, NestJS) or database ORMs. The backend runs exclusively on native Node.js standard libraries (`node:http`, `node:crypto`, `node:fs`, `node:path`).
- **Lockfile Integrity**: `package-lock.json` uses version 3 format with cryptographically secure SHA-512 subresource integrity hashes across all installed modules.

---

## 2. Dependency Manifest Inventory

### 2.1 Production Runtime Dependencies (`package.json`)

| Package Name | Specified Range | Installed Version | Direct / Transitive | Purpose & Architectural Role | Known CVEs | Supply Chain Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`react`** | `^18.3.1` | 18.3.1 | Direct | Core UI rendering library. Uses declarative JSX with built-in text escaping against DOM XSS. | 0 | Minimal |
| **`react-dom`** | `^18.3.1` | 18.3.1 | Direct | DOM rendering target for React. Transitive dependency: `scheduler@0.23.2`. | 0 | Minimal |
| **`three`** | `^0.186.0` | 0.186.0 | Direct | WebGL 3D rendering engine for building exterior and apartment interior visualizations. | 0 | Low (client WebGL memory properly managed on unmount) |
| **`lucide-react`** | `^0.475.0` | 0.475.0 | Direct | Vector SVG iconography components. Zero runtime dependencies (peer: React). | 0 | Minimal |
| **`clsx`** | `^2.1.1` | 2.1.1 | Direct | High-performance utility for conditional CSS class string concatenation. Zero dependencies. | 0 | Minimal |
| **`scheduler`** | `0.23.2` | 0.23.2 | Transitive | React task scheduler. Maintained directly by Meta / React core team. | 0 | Minimal |

*Note: The server-side BFF requires zero third-party production npm dependencies. It operates entirely on native Node.js core modules.*

---

### 2.2 Development & Build Tooling Dependencies (`package.json`)

| Package Name | Specified Range | Installed Version | Purpose & Architectural Role | Known CVEs | Risk Profile |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`vite`** | `^6.1.0` | 6.1.0 | Fast frontend build bundler and local development server. Hardened with `server.fs.deny` (FE-03). | 0 | Development-only |
| **`@vitejs/plugin-react`** | `^4.3.4` | 4.3.4 | Official Vite plugin for React JSX compilation using Babel/SWC transforms. | 0 | Development-only |
| **`typescript`** | `~5.7.2` | 5.7.2 | Static typechecker for compile-time interface verification. | 0 | Development-only |
| **`@types/react`** | `^18.3.18` | 18.3.18 | TypeScript ambient type declarations for React. | 0 | Development-only |
| **`@types/react-dom`** | `^18.3.5` | 18.3.5 | TypeScript ambient type declarations for React DOM. | 0 | Development-only |
| **`@types/three`** | `^0.186.0` | 0.186.0 | TypeScript ambient type declarations for Three.js. | 0 | Development-only |
| **`@playwright/test`** | `^1.63.0` | 1.63.0 | Cross-browser End-to-End automated testing framework. | 0 | Development-only |

---

## 3. Automated Vulnerability Verification Proof

### 3.1 Verification Command & Verbatim Output

Command executed from project root (`d:\Anti-Gravity\Sansata`):
```powershell
npm.cmd audit
```

Verbatim Output:
```
found 0 vulnerabilities
```

### 3.2 Structured Audit Report (`npm.cmd audit --json`)

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0,
      "total": 0
    },
    "dependencies": {
      "prod": 9,
      "dev": 126,
      "optional": 53,
      "peer": 0,
      "peerOptional": 0,
      "total": 134
    }
  }
}
```

---

## 4. Supply Chain Risk Analysis & Posture

### 4.1 Minimalist Dependency Footprint
The application follows an aggressive supply-chain minimization posture:
1. **No External Web Middleware**: Bypassing heavy server frameworks (e.g. Express, Koa, Fastify) eliminates hundreds of transitive dependencies commonly prone to prototype pollution, path traversal, or regex denial of service (ReDoS).
2. **Zero Third-Party ORMs**: Avoiding ORMs like Prisma or Sequelize completely removes complex database drivers and binary engine sidecars.
3. **No Unpinned Dependencies**: All transitive dependencies in `package-lock.json` are pinned with subresource integrity hashes (`integrity: sha512-...`).

### 4.2 Development vs Production Isolation
- Development packages (`typescript`, `vite`, `@playwright/test`) are excluded from the production runtime.
- In production (`npm start`), only `server/index.mjs` executes, serving compiled static assets from `dist/` and providing BFF API routing without invoking development tooling.
- In development (`npm run dev`), `vite.config.ts` enforces `server.fs.deny: ['**/*.db', '**/.env*']`, preventing exposure of sensitive development artifacts over local networks.

---

## 5. Maintenance Recommendations

1. **Continuous Lockfile Verification**: Require `npm ci` rather than `npm install` in CI/CD pipelines to guarantee deterministic, tamper-proof builds.
2. **Automated Vulnerability Scanning**: Run `npm audit` as part of every pre-commit hook and deployment pipeline.
3. **Pinning Major Versions**: Maintain conservative semantic versioning constraints on Three.js and Vite to avoid unexpected API deprecations or security regressions.
