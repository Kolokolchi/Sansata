# Original User Request

## 2026-09-16T18:15:46Z

Conduct a comprehensive technical audit, security hardening, browser verification, and ongoing feature development on the existing Sansata real-estate visualizer project across parallel specialized tracks without modifying working architecture or package manager.

Working directory: d:\Anti-Gravity\Sansata
Integrity mode: development

Requested team: Full team with parallel tracks (Explorers -> Workers -> Independent Verifiers)

==================================================
GUIDELINES & CONSTRAINTS
- This is an EXISTING project (not greenfield). Do NOT create a new project.
- Do NOT reinitialize repository.
- Do NOT switch frameworks or package managers.
- Do NOT rewrite working code without necessity.
- Do NOT delete existing working functionality. Preserve pre-existing uncommitted work!
- Do NOT auto-migrate database. SQLite database (apartments.db) must not be deleted or destructively altered.
- Do NOT perform redesign just for redesign.
- Use current repository as primary source of truth.

==================================================
PARALLEL EXECUTION STRATEGY
Track A: PROJECT / TOOLING / ANTIGRAVITY / MCP / SKILLS
- Audit .agents/skills and .antigravity/skills. Ensure canonical skills exist with proper YAML frontmatter (svg-coordinate-expert, real-estate-data-architect, interactive-canvas-ux, webgl-3d-architect, panorama-360-expert, bff-proxy-security, form-sanitization-ratelimit, secrets-leak-prevention).
- Verify MCP tooling availability (Playwright, Chrome DevTools, Context7).

Track B: FRONTEND / SVG / REAL ESTATE VISUALIZER
- Audit and repair: Building selector, Section selector, Floor selector, Apartment selector, SVG overlays, polygon geometry, floor plans, tooltips, cards/modals, hover and selected states, History API routing, deep links, responsive & touch behavior.
- Ensure stable SVG coordinate system: polygons must never drift relative to floor background on resize or zoom.
- Hovering one apartment must not cause unnecessary full-canvas re-renders.

Track C: BACKEND / DATABASE / BITRIX24 BFF
- Audit server/index.mjs, server/leads.mjs, server/apiRouter.mjs, server/bitrixAdapter.mjs, server/rateLimiter.mjs, server/statusCache.mjs.
- Ensure CRM credentials, webhook URLs, deal IDs, and internal field structures are NEVER returned to browser or public DTOs.
- Preserve POST /api/leads for consultation/booking inquiries.

Track D: SECURITY & ZERO-TRUST
- Audit for secrets, tokens, webhooks, API keys. Inspect .env*, gitignore, bundles, logs, API responses.
- Enforce server-side validation, E.164 phone normalization, proxy trust protection, rate limiting (e.g. 3 submissions / 10 min), honeypot.
- Run `npm run security:scan` and verify zero credential leaks. Report findings by file/type only without disclosing actual secret values.

Track E: THREE.JS / GLB / 360 PANORAMA
- Ensure Three.js / GLTF / 360 panorama scenes cleanly dispose geometries, materials, textures, and event listeners on unmount to prevent WebGL GPU memory leaks.
- Avoid unconstrained raycasting on pointermove.

Track F: QA / TESTS / CURRENT PROJECT STATE
- Run automated suites: `npm test`, `npm run security:scan`, `npm run build`.
- E2E Playwright verification on Desktop (1920x1080, 1366x768), Tablet, and Mobile.
- Verify user flow: Open app -> Select Building/Section/Floor -> Hover apartment -> Open apartment modal -> Close -> Deep links.
- Independent verification agents to review code diffs against architecture contracts.

Track G: REFERENCE WEBSITE ANALYSIS
- Analyze reference site: https://stavni-obvodny.ru/visual/section/66/floor/91/
- Inspect DOM, Network, SVG/Canvas/WebGL usage, floor switching, apartment hover/click, tooltips, URL state, responsive behavior.
- Document findings in docs/reference-gap-analysis.md.

==================================================
PHASES
1. READ-ONLY AUDIT FIRST:
   Explorers analyze all tracks and generate:
   - docs/project-audit.md (Current architecture, Implemented, Partially implemented, Broken, Missing, Security, Performance, Tech debt, Critical/High/Medium priorities)
   - docs/reference-gap-analysis.md (Reference features vs Current implementation, Gaps, Recommendations)
   - docs/architecture-contracts.md (Canonical domain hierarchy: Building -> Section -> Floor -> Apartment; Public DTO contracts)
2. WORKER IMPLEMENTATION:
   Workers fix Critical and High issues first with exclusive file ownership.
   Then resume active feature development: continue the interactive customer journey (Masterplan -> Section -> Floor -> Apartment -> Detail View / Consultation) from the current uncommitted state.
3. INDEPENDENT VERIFICATION:
   Adversarial review by independent verifiers against acceptance criteria.
   Runtime browser verification with Playwright and Chrome DevTools.
   Execute `npm test`, `npm run security:scan`, `npm run build`.

==================================================
ACCEPTANCE CRITERIA
- [ ] docs/project-audit.md, docs/reference-gap-analysis.md, and docs/architecture-contracts.md created and documented.
- [ ] Zero CRM secrets, webhook URLs, deal IDs, or internal CRM schemas exposed to client.
- [ ] Server-side input validation, rate limiting, and honeypot enforced on lead/booking endpoints.
- [ ] SVG visualizer polygons pixel-locked on resize/zoom without full-canvas re-renders on hover.
- [ ] Three.js / 360 panorama components cleanly dispose GPU resources on unmount.
- [ ] Customer journey (Building -> Section -> Floor -> Apartment modal -> Close -> Deep linking) verified in Playwright across desktop, tablet, mobile.
- [ ] npm test, npm run security:scan, and npm run build pass cleanly.
- [ ] Pre-existing uncommitted work preserved without changing frameworks or package managers.

## 2026-09-17T08:59:15Z

# Teamwork Project Prompt

Requested team: Full multi-agent team

Execute a comprehensive refactoring of the Sansata Shattyq real-estate web application based on the technical audit (docs/PROJECT-AUDIT.md). Eliminate critical WebGL/GPU memory leaks and CPU raycasting bottlenecks in 3D viewers, preserve SPA routing context without page reloads, harden the server-side BFF and rate-limiting security perimeter, and harmonize build, types, and automated verification suites without breaking existing features or leaking CRM data.

Working directory: d:\Anti-Gravity\Sansata
Integrity mode: development

Reference material:
- docs/PROJECT-AUDIT.md
- docs/INTEGRATIONS.md
- docs/architecture-contracts.md

## Requirements

### R1. 3D Viewer & GPU Lifecycle Optimization
Resolve WebGL resource disposal leaks and animation loop bottlenecks across 3D complex and apartment interior viewers. Ensure scene unmounting disposes all geometries, materials, textures, and render targets, and limit raycasting to interactive targets to maintain smooth 60 FPS performance without continuous React re-renders.

### R2. Seamless SPA Navigation & State Stability
Eliminate full-browser window reloads (`location.assign`) when switching sections, floors, or apartment tabs, ensuring navigation remains within the client-side SPA router while preserving Three.js contexts and user interaction state.

### R3. Server-Side BFF Hardening & Zero-Trust Perimeter
Harden the Node.js BFF HTTP layer by securing IP resolution behind reverse proxies (`TRUST_PROXY`), aligning honeypot behavior to silent success (`200 OK`) without data persistence, preventing CRM internal ID leaks in apartment status feeds, and ensuring dev server middlewares expose identical API endpoints as production.

### R4. Component & Codebase Modernization
Clean up legacy unreferenced artifacts and git deletions, streamline feature components under `src/features/`, and enforce strict TypeScript typing aligned with the canonical real-estate hierarchy (Building → Section → Floor → Apartment).

### R5. Verification & Test Suite Harmonization
Ensure all automated unit and integration tests pass, verify zero secret leaks in the production bundle, and guarantee clean build compilation.

## Acceptance Criteria

### Performance & WebGL Stability
- [ ] Navigating into and out of 3D complex and interior viewers 10+ times does not trigger "Too many active WebGL contexts" or crash browser tab memory
- [ ] Raycasting during mouse movement over the 3D scene targets pickable meshes with throttled animation frame execution rather than traversing all scene nodes
- [ ] Hotspot projections and cursor tracking do not trigger root component re-renders on every animation frame

### Routing & User Experience
- [ ] Switching between floor, section, and apartment views performs seamless client-side SPA transitions without triggering browser window reloads
- [ ] SVG selection overlays maintain accurate aspect ratio and polygon alignment across responsive viewports

### Security & BFF Contracts
- [ ] Honeypot form submissions receive HTTP 200 success response while silently dropping storage and CRM delivery
- [ ] Client IP extraction uses direct socket address by default and parses `X-Forwarded-For` only when `TRUST_PROXY=true`
- [ ] `/api/apartments/status` responses contain only public catalog identifiers (`shattyq-*`) without exposing Bitrix internal entity IDs
- [ ] `npm.cmd run security:scan` executes and confirms zero CRM credentials or `UF_CRM_*` fields in bundle assets

### Build & Automated Tests
- [ ] `npm.cmd test` executes with 100% passing tests and 0 failures
- [ ] `npm.cmd run build` completes successfully with zero TypeScript compilation errors and clean Vite chunk generation
