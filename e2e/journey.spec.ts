import { test, expect } from '@playwright/test';

test.describe('Flow 1: Complete Interactive Customer Journey', () => {
  test('navigates Masterplan -> Section -> Floor -> Apartment -> Consultation Modal', async ({ page }) => {
    // 1. Load Visualizer (Masterplan Stage)
    await page.goto('/visual');
    await expect(page.locator('.journey-page')).toBeVisible();
    await expect(page.locator('.masterplan-stage')).toBeVisible();
    await expect(page.locator('.journey-title h1')).toHaveText('Найдите своё место в Shattyq.');

    // 2. Select Section 1
    const section1Btn = page.locator('button[aria-label="Выбрать секцию 1"]');
    await expect(section1Btn).toBeVisible();
    await section1Btn.click();

    // Verify transition to Section 1 Facade
    await expect(page).toHaveURL(/\/visual\/section\/1$/);
    await expect(page.locator('.facade-stage')).toBeVisible();
    await expect(page.locator('.journey-crumbs')).toContainText('Секция 1');

    // 3. Hover and Select Floor 2
    const floor2Btn = page.locator('button[aria-label^="Выбрать этаж 2"]');
    await expect(floor2Btn).toBeVisible();
    await floor2Btn.hover();
    await floor2Btn.click();

    // Verify transition to Floor 2 Map
    await expect(page).toHaveURL(/\/visual\/section\/1\/floor\/2$/);
    await expect(page.locator('.floor-stage')).toBeVisible();
    await expect(page.locator('.floor-map')).toBeVisible();
    await expect(page.locator('.floor-rail button.active')).toHaveAttribute('aria-label', 'Этаж 2');

    // 4. Hover and Click Apartment in Floor Map
    const apartmentUnits = page.locator('.floor-diagram button.floor-unit');
    await expect(apartmentUnits.first()).toBeVisible();
    await apartmentUnits.first().hover();
    await apartmentUnits.first().click();

    // Verify transition to Flat Detail Experience
    await expect(page).toHaveURL(/\/flat\/[a-zA-Z0-9-]+/);
    await expect(page.locator('.flat-experience')).toBeVisible();
    await expect(page.locator('.flat-info-title h1')).toContainText('комнатная квартира');
    await expect(page.locator('.flat-info-panel h2')).toContainText('Цена по запросу');

    // 5. Open Booking Consultation Modal
    const bookingBtn = page.locator('button:has-text("Запросить бронирование")');
    await expect(bookingBtn).toBeVisible();
    await bookingBtn.click();

    const consultModal = page.locator('dialog.modal[aria-label="Консультация по Shattyq"]');
    await expect(consultModal).toBeVisible();

    // Close Modal via close button
    const closeBtn = consultModal.locator('button.modal-close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(consultModal).not.toBeVisible();
  });

  test('opens apartment modal from homepage catalog and closes cleanly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.plan-grid')).toBeVisible();

    // Click on the first plan card image
    const firstPlanImage = page.locator('.plan-grid .plan-card .plan-image').first();
    await expect(firstPlanImage).toBeVisible();
    await firstPlanImage.click();

    // Verify Plan Detail Modal opens
    const planModal = page.locator('dialog.modal.wide');
    await expect(planModal).toBeVisible();
    await expect(planModal.locator('.detail-copy h2')).toContainText('комнатная');
    await expect(planModal.locator('.price-info strong')).toHaveText('Цена по запросу');

    // Close Modal
    await planModal.locator('button.modal-close').click();
    await expect(planModal).not.toBeVisible();
  });
});

test.describe('Flow 2: Deep Links and Browser History Navigation', () => {
  test('direct navigation to floor deep link and breadcrumbs history navigation', async ({ page }) => {
    // 1. Direct deep link to Section 1 Floor 2
    await page.goto('/visual/section/1/floor/2');
    await expect(page.locator('.journey-page')).toBeVisible();
    await expect(page.locator('.floor-stage')).toBeVisible();

    // Verify breadcrumbs contain expected hierarchy
    const crumbs = page.locator('nav.journey-crumbs');
    await expect(crumbs).toContainText('Генплан');
    await expect(crumbs).toContainText('Секция 1');
    await expect(crumbs).toContainText('Этаж 2');

    // 2. Click breadcrumb link to navigate back to Section 1
    const sectionCrumb = crumbs.locator('a:has-text("Секция 1")');
    await sectionCrumb.click();
    await expect(page).toHaveURL(/\/visual\/section\/1$/);
    await expect(page.locator('.facade-stage')).toBeVisible();

    // 3. Browser Back button to return to Floor 2
    await page.goBack();
    await expect(page).toHaveURL(/\/visual\/section\/1\/floor\/2$/);
    await expect(page.locator('.floor-stage')).toBeVisible();
    await expect(page.locator('.floor-rail button.active')).toHaveAttribute('aria-label', 'Этаж 2');

    // 4. Browser Forward button to return to Section 1
    await page.goForward();
    await expect(page).toHaveURL(/\/visual\/section\/1$/);
    await expect(page.locator('.facade-stage')).toBeVisible();
  });

  test('direct navigation to flat deep link and view mode switching', async ({ page }) => {
    // 1. Direct deep link to flat shattyq-5 (Section 1 Floor 2)
    await page.goto('/flat/shattyq-5');
    await expect(page.locator('.flat-experience')).toBeVisible();
    await expect(page.locator('.flat-info-title')).toContainText('SHATTYQ · ВАРИАНТ 5');
    await expect(page.locator('.flat-route')).toContainText('Секция 1 / Этаж 2 / Вариант 5');

    // 2. Switch to Plan View Tab
    const planTab = page.locator('.flat-view-tabs button:has-text("Планировка")');
    await expect(planTab).toBeVisible();
    await planTab.click();
    await expect(page.locator('.original-plan')).toBeVisible();
    await expect(page.locator('.plan-zoom-controls')).toBeVisible();

    // 3. Switch to Floor View Tab
    const floorTab = page.locator('.flat-view-tabs button:has-text("На этаже")');
    await expect(floorTab).toBeVisible();
    await floorTab.click();
    await expect(page.locator('.flat-floor-view')).toBeVisible();
    await expect(page.locator('.flat-floor-view .floor-diagram')).toBeVisible();
  });
});

test.describe('Flow 3: Consultation / Lead Submission, Validation, Honeypot & Rate Limiting', () => {
  test('submits valid consultation lead through UI modal and receives success receipt', async ({ page }) => {
    await page.goto('/');

    // Open consultation modal
    const consultBtn = page.locator('.contact-action button:has-text("Получить консультацию")');
    await consultBtn.scrollIntoViewIfNeeded();
    await consultBtn.click();

    const modal = page.locator('dialog.modal[aria-label="Консультация по Shattyq"]');
    await expect(modal).toBeVisible();

    // Fill form with valid details
    await modal.locator('input[autoComplete="given-name"]').fill('Азамат Темиров');
    await modal.locator('input[type="tel"]').fill('+7 (701) 234-56-78');
    await modal.locator('input[type="checkbox"]').check();

    // Submit form and observe response
    const submitBtn = modal.locator('button[type="submit"]');
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/leads')),
      submitBtn.click()
    ]);

    expect(response.status()).toBe(201);

    // Verify success receipt
    const successBox = modal.locator('.lead-success');
    await expect(successBox).toBeVisible();
    await expect(successBox.locator('h2')).toHaveText('Заявка сохранена');
  });

  test('validates required fields and phone format on client and server', async ({ page, request }) => {
    await page.goto('/');

    const consultBtn = page.locator('.contact-action button:has-text("Получить консультацию")');
    await consultBtn.scrollIntoViewIfNeeded();
    await consultBtn.click();

    const modal = page.locator('dialog.modal[aria-label="Консультация по Shattyq"]');
    await expect(modal).toBeVisible();

    const nameInput = modal.locator('input[autoComplete="given-name"]');
    const phoneInput = modal.locator('input[type="tel"]');
    const consentInput = modal.locator('input[type="checkbox"]');
    const submitBtn = modal.locator('button[type="submit"]');

    // Test 1: Whitespace name (passes HTML5 minLength but fails trim validation)
    await nameInput.fill('  A  ');
    await phoneInput.fill('+7 (701) 111-22-33');
    await consentInput.check();
    await submitBtn.click();

    const errorMsg = modal.locator('.form-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Введите имя');

    // Test 2: Invalid phone number
    await nameInput.fill('Азамат');
    await phoneInput.fill('12345');
    await submitBtn.click();
    await expect(errorMsg).toContainText('Укажите номер в формате +7');

    // Test 3: Direct API validation rejection for missing consent
    const noConsentIp = `10.10.99.${Math.floor(Math.random() * 200 + 10)}`;
    const noConsentRes = await request.post('/api/leads', {
      headers: { 'x-forwarded-for': noConsentIp },
      data: {
        name: 'Азамат Темиров',
        phone: '+77011112233',
        consent: false,
        requestId: 'noconsent-' + Date.now()
      }
    });
    expect(noConsentRes.status()).toBe(400);
    const noConsentBody = await noConsentRes.json();
    expect(noConsentBody.error).toContain('согласие');
  });

  test('verifies honeypot anti-spam defense and rate limiter enforcement', async ({ request }) => {
    // Isolated IP for rate limit & honeypot tests to avoid polluting UI browser test IP bucket
    const testIp = `198.51.100.${Math.floor(Math.random() * 200 + 10)}`;

    // 1. Honeypot check: bot submitting hidden website field is intercepted safely
    const honeypotRes = await request.post('/api/leads', {
      headers: { 'x-forwarded-for': testIp },
      data: {
        name: 'Spam Bot',
        phone: '+77019998877',
        consent: true,
        topic: 'Spam Infiltration',
        website: 'https://bad-bot-url.com',
        requestId: 'honeypot-test-req-' + Date.now()
      }
    });

    // Server must reject bot (either 200 silent success receipt or 400 rejection) without crashing
    expect([200, 400]).toContain(honeypotRes.status());
    const honeypotBody = await honeypotRes.json();
    expect(honeypotBody).toBeDefined();

    // 2. Rate Limiting enforcement: excessive requests from same IP trigger HTTP 429
    let rateLimited = false;
    for (let i = 0; i < 5; i++) {
      const res = await request.post('/api/leads', {
        headers: { 'x-forwarded-for': testIp },
        data: {
          name: `Rate Tester ${i}`,
          phone: `+7701888000${i}`,
          consent: true,
          topic: 'Rate limit test',
          requestId: `rl-req-${i}-${Date.now()}`
        }
      });

      if (res.status() === 429) {
        rateLimited = true;
        const body = await res.json();
        expect(body.error).toMatch(/Слишком много/i);
        break;
      }
    }

    expect(rateLimited).toBe(true);
  });
});

test.describe('Flow 4: Multi-Viewport Layout & Touch Responsiveness', () => {
  test('adapts layout cleanly across desktop, tablet, and mobile viewports without horizontal overflow', async ({ page }) => {
    await page.goto('/visual/section/1/floor/2');
    await expect(page.locator('.journey-page')).toBeVisible();

    const viewport = page.viewportSize();
    if (!viewport) return;

    // Check no horizontal scrollbar on root
    const hasNoHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 2;
    });
    expect(hasNoHorizontalOverflow).toBe(true);

    if (viewport.width >= 1024) {
      // Desktop: Brand navigation & header phone visible
      await expect(page.locator('nav.desktop-nav')).toBeVisible();
      await expect(page.locator('a.phone')).toBeVisible();
      await expect(page.locator('a.phone strong')).toHaveText('700');
    } else if (viewport.width < 768) {
      // Mobile: Desktop nav hidden, menu button visible
      await expect(page.locator('nav.desktop-nav')).toBeHidden();
      const menuBtn = page.locator('button.menu-button');
      await expect(menuBtn).toBeVisible();

      // Tap menu button opens navigation modal
      await menuBtn.click();
      const menuModal = page.locator('dialog.modal[aria-label="Навигация"]');
      await expect(menuModal).toBeVisible();
      await expect(menuModal.locator('h2')).toContainText('Счастье');

      // Close menu modal
      await menuModal.locator('button.modal-close').click();
      await expect(menuModal).not.toBeVisible();
    }

    // Floor rail and units remain interactable in all viewports
    const floorUnits = page.locator('.floor-diagram button.floor-unit');
    await expect(floorUnits.first()).toBeVisible();
    await floorUnits.first().click();
    await expect(page).toHaveURL(/\/flat\/[a-zA-Z0-9-]+/);
  });
});
