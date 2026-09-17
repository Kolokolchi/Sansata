# Project Instructions & Skill Architecture

## Specialized Skills

This project enforces eight core architectural and security skills located in `.antigravity/skills/`:

1. **[svg-coordinate-expert.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/svg-coordinate-expert.md)**:
   - Relative coordinates and unified coordinate grid via `viewBox`.
   - Strict avoidance of hardcoded pixel bounds on `<polygon points="...">`.
   - Pointer events isolation: `pointer-events: visiblePainted` for interactive polygons, `none` for background floorplans/blueprints.
   - Polygon centroid computation (Shoelace formula + pole of inaccessibility fallback) for tooltips and badges.

2. **[real-estate-data-architect.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/real-estate-data-architect.md)**:
   - Strict entity hierarchy: `Building -> Section -> Floor -> Apartment`.
   - Required apartment schema: `id`, `number`, `rooms`, `area`, `price`, `status` (`'available' | 'reserved' | 'sold'`), `polygonPoints`.
   - $O(1)$ indexed lookup structures (`apartmentsById`) for zero-lag hover interactions.
   - SQLite relational schema with proper indexing for `apartments.db`.

3. **[interactive-canvas-ux.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/interactive-canvas-ux.md)**:
   - Smooth pan & zoom with GPU acceleration (`transform: translate3d(...) scale(...)`, `will-change: transform`).
   - Integration with `@floating-ui/dom` via virtual elements (anchors) based on screen coordinates and polygon centroids.
   - Zero-jank render isolation: CSS-driven hover states, avoiding global component re-renders.

4. **[webgl-3d-architect.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/webgl-3d-architect.md)**:
   - Three.js, GLTFLoader, DRACOLoader, OrbitControls.
   - Compressed `.glb` with local Draco decoder (`public/assets/draco/gltf/`).
   - Strict resource disposal pipeline (`geometry.dispose()`, `material.dispose()`, textures).
   - Throttled Raycasting on low-poly bounding proxy objects.
   - OrbitControls clamping (`minPolarAngle`, `maxPolarAngle`, `minDistance`, `maxDistance`) and PMREM PBR lighting.

5. **[panorama-360-expert.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/panorama-360-expert.md)**:
   - Equirectangular 2:1 projection with progressive loading (low-res preview -> high-res).
   - Spherical coordinate hotspots `(yaw, pitch)` with smooth fade transitions.
   - Mobile UX: gesture-based gyroscope permissions and touch scroll isolation.
   - Floor height panorama feed schema `{ buildingId, floorNumber, roomType, panoramaUrl, initialYaw }` for window views.

6. **[bff-proxy-security.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/bff-proxy-security.md)**:
   - Zero Trust to Client. Frontend never connects to Bitrix24 directly.
   - No `VITE_`, `NEXT_PUBLIC_`, `REACT_APP_` for CRM secrets.
   - Isolated server gateway (`/api/lead`, `/api/booking`, `/api/apartments/status`).
   - Strict response masking with sanitized public DTOs.

7. **[form-sanitization-ratelimit.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/form-sanitization-ratelimit.md)**:
   - Zod input validation (E.164 phone, sanitized names, 8 KB max payload).
   - Rate limiting (max 3-5 requests per 10 minutes per IP).
   - Anti-spam: silent honeypot dropping and CAPTCHA token verification.

8. **[secrets-leak-prevention.md](file:///d:/Anti-Gravity/Sansata/.antigravity/skills/secrets-leak-prevention.md)**:
   - Mandatory exclusion of `.env*` from git (except `.env.example`).
   - Post-build bundle scanner `scripts/scan-bundle-secrets.mjs` checking `dist/` for exposed tokens.

---

## MCP Server Integrations
Configured in `mcp_config.json`:
- `puppeteer`: SVG structure parsing and reference asset scraping.
- `context7`: Up-to-date documentation for frontend/graphic libraries.
- `sequential-thinking`: Complex geometric transformations and polygon calculations.
- `sqlite`: Local SQLite database operations (`apartments.db`).
- `filesystem`: Local filesystem access for project assets (`public/assets/3d`, `public/assets/panoramas`).
