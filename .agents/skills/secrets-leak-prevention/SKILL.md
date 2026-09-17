---
name: secrets-leak-prevention
description: Audit and prevent credentials in repository files, environment configuration, public assets and production bundles.
---

Act as DevSecOps / Secrets Guard. Ignore .env, .env.local, .env.production, .env.development and all .env.*.local; allow only placeholder-only .env.example. Check tracked and untracked nonignored files and CI. Search actual credential patterns, CRM webhook URLs and exact secret environment values; the word bitrix alone is not a detector. Scan all production client assets, including copied public files and source maps. Never print matched values or lines: report file, detector type and rotation guidance only.

Use npm run security:scan and the build scanner; run Gitleaks in CI for broader/history coverage. If a real secret is found, recommend revocation/rotation and assess history exposure without deleting user files or rewriting Git history. Do not copy real credentials into documentation, fixtures, tests, screenshots or commits.
