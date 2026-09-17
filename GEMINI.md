# Sansata Project Instructions (GEMINI.md)

Preserve React/Vite, npm, TypeScript, Three.js and the existing Node HTTP middleware. Read README.md, docs/INTEGRATIONS.md and docs/PROJECT-AUDIT.md before architectural changes. Preserve pre-existing uncommitted work. Do not rewrite working code or introduce abstractions without examining existing equivalents. Find the root cause before fixing bugs.

## Tooling and Verification

- Use Context7 before implementing version-sensitive third-party APIs. If unavailable, state that and consult official version-matched documentation.
- Use Chrome DevTools MCP to analyze public reference sites; determine the actual rendering technology before choosing SVG/Canvas/WebGL.
- Verify substantial UI changes in a browser; use Playwright for user flows on desktop, tablet and mobile. Check hover, click, touch, keyboard, deep links, console and network. Resolve new runtime/framework warnings, TypeScript errors and failed requests.
- Never consider UI complete without browser verification across target viewports.
- Measure performance before optimizing (FPS, draw calls, memory allocation, bundle size).
- After substantial changes, run relevant tests (`npm test`, `npm run test:e2e` for affected flows) and `npm run build`. No lint stack exists; do not claim lint passed.
- Antigravity CLI MCP configuration is `.agents/mcp_config.json`. Native Codex MCP configuration is `.codex/config.toml`. Legacy `mcp_config.json` and `.antigravity/` are preserved for backward compatibility; do not install old Puppeteer/SQLite MCP servers.

## Domain and Security

- Discover domain skills in `.agents/skills/`. Legacy geometry/data/UX instructions in `.antigravity/skills/` remain supplementary; current CLI skills and explicit user instructions govern conflicts.
- Preserve canonical Building → Section → Floor → Apartment model; do not create competing domain types.
- The current catalog represents published layout variants, not a saleable apartment register. Preserve `unknown` availability and null prices; never invent unit numbers, official geometry or available stock.
- Zero Trust Client Boundary: Browser → public API → application service → Bitrix adapter → CRM. Never execute browser → Bitrix API calls directly.
- CRM IDs, Deal IDs, and raw CRM responses must not enter public DTOs.
- Keep CRM credentials strictly server-side; never use VITE_*, NEXT_PUBLIC_* or REACT_APP_* for secrets. Never put real credentials in documentation, tests, fixtures, screenshots, logs or commits.
- Run `npm run security:scan` and the build asset scan. Ignore all real `.env*` files except placeholder-only `.env.example`. Report suspected secrets by file/type only and recommend rotation.
- Keep local lead persistence visibly local. Booking requests are consultation requests until a verified unit register and server-side CRM workflow exist.
