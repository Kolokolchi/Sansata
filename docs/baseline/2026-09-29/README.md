# Визуальная основа от 29.09.2026

54 снимка: 18 маршрутов/состояний × desktop 1920×1080, tablet 768×1024, mobile 393×851. Сняты установленным Playwright/Chromium с локального Vite `http://127.0.0.1:3000`, после загрузки страницы и шрифтов. Touch-эмуляция включена для tablet/mobile. Это снимки viewport, а не полностраничные изображения; часть содержимого ниже экрана. Для сравнения повторять URL, состояние и положение прокрутки. Динамический WebGL и внешний iframe не дают побитово стабильного изображения.

[Карта сайта и порядок изменений](../../SITE-BASELINE.md). [Машинный журнал осмотра: URL, размеры, заголовки, ошибки и предупреждения](inspection.json).

## Результаты проверки

- `npm.cmd test`: 78/78 пройдены.
- `npm.cmd run test:e2e -- --workers=2`: 128/128 пройдены, четыре проекта из текущего `playwright.config.ts`, около 3,1 минуты. Включены пользовательские переходы, hover/touch/keyboard, история, глубокие ссылки, формы и ошибки загрузки.
- `npm.cmd run build`: TypeScript и production-сборка успешны. `npm.cmd run security:scan` после сборки: подозрительные CRM-секреты/идентификаторы в клиентском бандле не обнаружены. Это проверка сигнатур в dist, не гарантия отсутствия всех видов секретов.
- При дополнительном обходе 54 состояний: нет pageerror, ответов HTTP ≥400, обнаруженных сломанных загруженных img или горизонтального переполнения документа. Это автоматические признаки, а не доказательство корректности каждого пикселя и всех внешних ресурсов.
- Визуально просмотрены главная и карточка квартиры на desktop/mobile, подбор на tablet, этаж, шахматка и выбор объекта на desktop. Остальные сохранённые изображения доступны для сравнения; взаимодействия покрываются существующим E2E в пределах его утверждений.
- Исходные предупреждения: GPU `ReadPixels` при desktop WebGL-просмотре; предупреждение об устаревшем подключении Three.js внутри внешнего тура `/sandbox/zems-tour`. В раннере также есть предупреждение окружения `NO_COLOR`/`FORCE_COLOR`. Они не исправлялись в задаче по сохранению основы и не являются новыми изменениями приложения.
- Chrome DevTools MCP вернул `Target closed`; осмотр выполнен через Playwright. Содержимое внешнего Matterport не контролируется этим проектом, доступность в будущем не гарантируется. Измерение FPS/памяти и полная проверка production-хостинга не проводились.

## Снимки

| Экран | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| Главная | [Снимок](desktop-home.jpg) | [Снимок](tablet-home.jpg) | [Снимок](mobile-home.jpg) |
| Выбор объекта | [Снимок](desktop-projects.jpg) | [Снимок](tablet-projects.jpg) | [Снимок](mobile-projects.jpg) |
| Подбор по параметрам | [Снимок](desktop-parameters.jpg) | [Снимок](tablet-parameters.jpg) | [Снимок](mobile-parameters.jpg) |
| Секция 1 | [Снимок](desktop-section.jpg) | [Снимок](tablet-section.jpg) | [Снимок](mobile-section.jpg) |
| Секция 1, этаж 2 | [Снимок](desktop-floor.jpg) | [Снимок](tablet-floor.jpg) | [Снимок](mobile-floor.jpg) |
| Каталог уровня E2 | [Снимок](desktop-level.jpg) | [Снимок](tablet-level.jpg) | [Снимок](mobile-level.jpg) |
| Квартира № 1, объёмный вид | [Снимок](desktop-apartment-tour.jpg) | [Снимок](tablet-apartment-tour.jpg) | [Снимок](mobile-apartment-tour.jpg) |
| Квартира № 1, планировка | [Снимок](desktop-apartment-plan.jpg) | [Снимок](tablet-apartment-plan.jpg) | [Снимок](mobile-apartment-plan.jpg) |
| Опубликованная планировка | [Снимок](desktop-published-plan.jpg) | [Снимок](tablet-published-plan.jpg) | [Снимок](mobile-published-plan.jpg) |
| Шахматка | [Снимок](desktop-chessboard.jpg) | [Снимок](tablet-chessboard.jpg) | [Снимок](mobile-chessboard.jpg) |
| Снимок помещений | [Снимок](desktop-stock.jpg) | [Снимок](tablet-stock.jpg) | [Снимок](mobile-stock.jpg) |
| Материалы | [Снимок](desktop-materials.jpg) | [Снимок](tablet-materials.jpg) | [Снимок](mobile-materials.jpg) |
| Тур по комплексу | [Снимок](desktop-complex-tour.jpg) | [Снимок](tablet-complex-tour.jpg) | [Снимок](mobile-complex-tour.jpg) |
| Демонстрационный интерьер | [Снимок](desktop-interior-demo.jpg) | [Снимок](tablet-interior-demo.jpg) | [Снимок](mobile-interior-demo.jpg) |
| Greybox HDRI | [Снимок](desktop-greybox.jpg) | [Снимок](tablet-greybox.jpg) | [Снимок](mobile-greybox.jpg) |
| Внешний тур | [Снимок](desktop-zems.jpg) | [Снимок](tablet-zems.jpg) | [Снимок](mobile-zems.jpg) |
| Архивный адрес | [Снимок](desktop-retired.jpg) | [Снимок](tablet-retired.jpg) | [Снимок](mobile-retired.jpg) |
| Неизвестный адрес | [Снимок](desktop-not-found.jpg) | [Снимок](tablet-not-found.jpg) | [Снимок](mobile-not-found.jpg) |

## Как пользоваться эталоном

Сначала сравнивать новую правку с фактическим состоянием до неё, затем с этими снимками и [правилами](../../../AGENTS.md). Сентябрьский эталон не разрешает откатывать последующие согласованные изменения. Не заменять эти изображения при падении тестов и не выдавать их за автоматически подключённые visual-regression assertions: это сохранённый визуальный ориентир. Для явно заказанного изменения основы сохранять новый датированный набор и объяснение изменения, оставляя этот набор доступным.

