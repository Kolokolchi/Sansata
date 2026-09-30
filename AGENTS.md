# Sansata project instructions

## Обязательное сохранение существующего сайта

Единственный активный проект — SAF Avenue. По поручению пользователя старый продукт, его форматы, ресурсы и дубли инструкций убраны. Не восстанавливать их при новых правках. Обе 3D-песочницы (`/sandbox/greybox-tour`, `/sandbox/zems-tour`) сохраняются до отдельного переноса в квартиры; очистка проекта не разрешает редизайн SAF.

Текущий сайт SAF Avenue — принятая пользователем основа. Новая функция означает дополнение существующего сайта, а не его пересоздание. Эти правила действуют для всех задач в репозитории и всех работающих с ним агентов.

- Перед каждой правкой прочитайте [карту и эталон сайта](docs/SITE-BASELINE.md), проверьте `git status --short` и diff затрагиваемых файлов, найдите существующую реализацию через `rg`. Учитывайте и tracked, и untracked файлы: незакоммиченные наработки также являются основой. HEAD не обязательно содержит актуальный сайт.
- Сохраняйте текущие внешний вид, компоновку, шапку, логотипы, шрифты, цвета, фотографии, панели управления, адаптивность и последовательность пользовательских действий вне явно запрошенного изменения. «Добавить функцию», «исправить» или «оптимизировать» не означает разрешение на редизайн.
- Запрещено попутно переписывать `App.tsx`, заменять маршрутизацию, заново собирать страницы, менять стек, вводить UI-фреймворк, заменять CSS-систему, удалять рабочие функции или массово форматировать/переименовывать файлы. При необходимости вносите небольшие изменения в существующий компонент; сначала проверяйте его вызовы, стили и тесты.
- До реализации кратко обозначьте конкретное изменение и затрагиваемые модули. Расширяйте существующие компоненты и функции; новый модуль добавляйте для новой ответственности, не создавая параллельную версию уже работающего экрана, каталога или модели данных.
- Не сбрасывайте, не перезаписывайте и не удаляйте чужие изменения; не применяйте `git reset --hard`, `git clean`, восстановление файлов из HEAD или автоматический stash для «чистого старта». Не заменяйте реальные данные, изображения, геометрию и туры заглушками ради удобства реализации.
- Сохраняйте все существующие прямые ссылки, query-параметры, Back/Forward, localStorage и смысл API. При необходимой смене формата предусмотрите совместимость/миграцию. Отсутствие раздела в меню не разрешает удалять его маршрут.
- CSS новой функции ограничивайте её контейнером. Не меняйте глобальные селекторы, порядок импортов стилей и общие брейкпоинты ради одного экрана. Проверяйте все страницы, использующие изменённый общий компонент или стиль.
- Главная `/` остаётся визуальным выбором комплекса сразу под шапкой. `/projects` остаётся выбором объекта; `/saf` — подбором по параметрам. Не возвращайте главную прежнего проекта, презентационный блок перед подбором или удалённое меню «О проекте». Демонстрации `/tour` и `/sandbox/*` не подменяют основной путь выбора квартиры.
- Архивный аудит, референсы, roadmap и рекомендации навыков не являются поручением перестроить продукт. При расхождении сверяйтесь с текущим кодом и браузером; исторические дефекты сначала воспроизводите заново. Не выполняйте пункты roadmap попутно.
- Для UI-правок снимите состояние ДО и ПОСЛЕ в одинаковом viewport и состоянии. Сравните с `docs/baseline/2026-09-29/` и актуальным состоянием до задачи. Не обновляйте эталон и не ослабляйте тесты только для сокрытия регрессии. Существующие снимки сохраняйте; новые согласованные изменения документируйте отдельно.
- Завершение задачи требует проверки новой функции И сохранения соседних сценариев по матрице в `docs/SITE-BASELINE.md`. При сбое отделяйте исходный дефект от своей регрессии. Не заявляйте проверку, которую не запускали.
- Если задача действительно требует изменения основы вне уже явно разрешённого пользователем объёма, сначала подготовьте конкретное объяснение затрагиваемых экранов и минимального изменения, затем уточните объём. Обычные локальные дополнения и исправления выполняйте без повторного согласования. Явное поручение пользователя изменить конкретный элемент разрешает это изменение, но не остальные.
- В результате перечислите изменённые файлы, суть локального дополнения, выполненные проверки и оставшиеся ограничения. Не создавайте коммит или публикацию только ради фиксации эталона без соответствующего поручения.

Preserve React/Vite, npm, TypeScript, Three.js and the existing Node HTTP middleware. Read README.md, docs/INTEGRATIONS.md and docs/PROJECT-AUDIT.md before architectural changes. Preserve pre-existing uncommitted work. Do not rewrite working code or introduce abstractions without examining existing equivalents. Find the root cause before fixing bugs.

## Tooling and verification

- Use Context7 before implementing version-sensitive third-party APIs. If unavailable, state that and consult official version-matched documentation.
- Use Chrome DevTools MCP to analyze public reference sites; determine the actual rendering technology before choosing SVG/Canvas/WebGL.
- Verify substantial UI changes in a browser; use Playwright for user flows on desktop, tablet and mobile. Check hover, click, touch, keyboard, deep links, console and network. Resolve new runtime/framework warnings, TypeScript errors and failed requests.
- Never consider UI complete without browser verification across target viewports.
- Measure performance before optimizing (FPS, draw calls, memory allocation, bundle size).
- After substantial changes, run relevant tests (`npm test`, `npm run test:e2e` for affected flows) and `npm run build`. No lint stack exists; do not claim lint passed.
- Antigravity CLI MCP configuration is `.agents/mcp_config.json`. Native Codex MCP configuration is `.codex/config.toml`. These are the only active MCP configurations; do not restore legacy root configs or install old Puppeteer/SQLite MCP servers.

## Domain and security

- Discover domain skills in `.agents/skills/`. Only current `SKILL.md` directories are maintained; do not restore duplicate legacy skill files.
- Preserve canonical Building → Section → Floor → Apartment model; do not create competing domain types.
- The current catalog represents published layout variants, not a saleable apartment register. Preserve `unknown` availability and null prices; never invent unit numbers, official geometry or available stock.
- Zero Trust Client Boundary: Browser → public API → application service → Bitrix adapter → CRM. Never execute browser → Bitrix API calls directly.
- CRM IDs, Deal IDs, and raw CRM responses must not enter public DTOs.
- Keep CRM credentials strictly server-side; never use VITE_*, NEXT_PUBLIC_* or REACT_APP_* for secrets. Never put real credentials in documentation, tests, fixtures, screenshots, logs or commits.
- Run `npm run security:scan` and the build asset scan. Ignore all real `.env*` files except placeholder-only `.env.example`. Report suspected secrets by file/type only and recommend rotation.
- Keep local lead persistence visibly local. Booking requests are consultation requests until a verified unit register and server-side CRM workflow exist.

