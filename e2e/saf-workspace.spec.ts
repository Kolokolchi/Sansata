import { expect, test } from '@playwright/test';

test('object selection opens the project photo before the SAF configurator', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Выберите объект.' })).toBeVisible();
  await expect(page.locator('.saf-project-card')).toHaveCount(1);
  await expect(page.locator('.saf-project-card')).toContainText('SAF Avenue');
  if ((page.viewportSize()?.width || 0) <= 768) await page.locator('.saf-project-card').tap();
  else await page.locator('.saf-project-card').click();
  await expect(page).toHaveURL(/\/saf\/avenue$/);
  await expect(page.getByRole('heading', { name: 'Привилегия приватной жизни' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.saf-landing-photo')).toBeVisible();
  await page.getByRole('link', { name: 'Посмотреть по параметрам' }).click();
  await expect(page).toHaveURL(/\/saf$/);
  await expect(page.getByRole('heading', { name: /Поиск квартир по параметрам/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toContainText('Квартиры');
  expect(errors).toEqual([]);
});

test('filters, saved plans and comparison work across reload', async ({ page }) => {
  await page.goto('/saf');
  await page.getByRole('button', { name: '1', exact: true }).click();
  await expect(page.locator('.saf-plan-card').first()).toContainText('1-комнатная');
  const count = await page.locator('.saf-plan-card').count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(150);

  await page.getByLabel('Код планировки').fill('KV-P7-E3-S1');
  await expect(page.locator('.saf-plan-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Добавить в подборку KV-P7-E3-S1' }).click();
  await page.locator('.saf-plan-card-actions button').click();
  await expect(page.locator('.saf-compare-bar')).toContainText('KV-P7-E3-S1');
  await page.reload();
  await page.getByLabel('Только подборка').check();
  await expect(page.locator('.saf-plan-card')).toHaveCount(1);
  await expect(page.locator('.saf-compare-bar')).toContainText('KV-P7-E3-S1');
  await page.getByRole('button', { name: /Смотреть сравнение/ }).click();
  await expect(page).toHaveURL(/\/saf\/compare$/);
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(2);
  await expect(page.locator('.saf-shortlist-table')).toContainText('KV-P7-E3-S1');
});

test('deep link, history and retired 3D route', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/saf/plan/KV-P7-E3-S1');
  await expect(page.getByRole('heading', { name: '1-комнатная планировка' })).toBeVisible();
  await expect(page.locator('.saf-detail-panel')).toContainText('Наличие и цена уточняются');
  await page.getByRole('link', { name: /К планировкам/ }).click();
  await expect(page).toHaveURL(/\/saf$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/saf\/plan\/KV-P7-E3-S1$/);
  for (const retiredPath of ['/visual/free', '/cloud-tour', '/audiogid']) {
    await page.goto(retiredPath);
    await expect(page.getByRole('heading', { name: 'Раздел обновлён.' })).toBeVisible();
    await expect(page.locator('canvas, iframe, audio')).toHaveCount(0);
  }
  await expect(page.getByText('Свободный 3D')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('layout stays usable at every configured viewport', async ({ page }) => {
  await page.goto('/saf');
  await expect(page.locator('.saf-filters')).toBeVisible();
  await expect(page.locator('.saf-plan-card').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  const imageLink = page.locator('.saf-plan-card').first().locator('.saf-plan-image');
  if ((page.viewportSize()?.width || 0) >= 1024) {
    await imageLink.hover();
    await expect(imageLink.locator('img')).toBeVisible();
  }
  await imageLink.focus();
  await expect(imageLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.saf-viewer-stage')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
});

test('original logos and restored apartment views', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/saf/plan/KV-P7-E3-S1');
  await expect(page.getByRole('img', { name: 'Sensata Group', exact: true })).toBeVisible();
  await expect(page.locator('.saf-viewer canvas')).toBeVisible();
  for (const name of ['3D вид сверху', 'Вращение 360°', 'Панорамный тур']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.saf-viewer canvas')).toBeVisible();
  }
  await page.getByRole('button', { name: 'Спальня', exact: true }).click();
  await expect(page).toHaveURL(/point=1/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Спальня', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Планировка', exact: true }).click();
  await expect(page.locator('.saf-viewer-plan')).toBeVisible();
  await page.getByRole('button', { name: 'Объёмный вид', exact: true }).click();
  await expect(page.locator('.saf-viewer canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Интерьер', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Сохранить на устройстве' })).toBeVisible();
  await page.getByRole('button', { name: 'Сохранить на устройстве' }).click();
  await expect(page.getByRole('status')).toContainText('сохранён');
  expect(errors).toEqual([]);
});

test('invalid panorama point and disabled storage do not break the workspace', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage disabled'); } });
  });
  await page.goto('/saf/plan/KV-P7-E3-S1?view=panorama&point=Infinity');
  await expect(page.locator('.saf-viewer canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Гостиная', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /К планировкам/ }).click();
  await page.getByLabel('Код планировки').fill('KV-P7-E3-S1');
  await page.getByRole('button', { name: 'Добавить в подборку KV-P7-E3-S1' }).click();
  await expect(page.getByRole('button', { name: 'Убрать из подборки KV-P7-E3-S1' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('comparison supports more than three published layouts and persists across tabs',async({page,context})=>{
  await page.goto('/saf');
  for(let index=0;index<4;index++)await page.locator('.saf-plan-card-actions button').nth(index).click();
  await expect(page.locator('.saf-compare-bar')).toContainText('Выбрано планировок: 4');
  await page.getByRole('button',{name:/Смотреть сравнение/}).click();
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(5);
  await page.reload();
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(5);
  const other=await context.newPage();
  await other.goto('/saf/compare');
  await other.locator('.saf-shortlist-remove').first().click();
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(4);
  await other.close();
  await page.locator('.saf-shortlist-save').first().click();
  await page.getByRole('link',{name:'Открыть избранное',exact:true}).click();
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(1);
  await page.locator('.saf-shortlist-remove').click();
  await expect(page.getByRole('heading',{name:'В избранном пока пусто',exact:true})).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/saf\/compare$/);
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(4);
});

test('apartment selection works in memory when browser storage is disabled',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('Storage disabled');}});});
  await page.goto('/saf/apartment/saf-observation-1-2-property-1?tab=plan');
  await page.getByRole('button',{name:'Сохранить квартиру в избранное',exact:true}).click();
  await page.getByRole('button',{name:'Сравнить',exact:true}).click();
  await page.getByRole('link',{name:'Моё избранное',exact:true}).click();
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(1);
  await page.getByRole('link',{name:'Смотреть сравнение (1)',exact:true}).click();
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(2);
  await page.locator('.saf-shortlist-remove').click();
  await expect(page.getByRole('heading',{name:'Пока нечего сравнивать',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test('simultaneous shortlist changes in two tabs preserve additions and removals', async ({ page, context }) => {
  const other = await context.newPage();
  const ids = ['saf-observation-1-2-property-1', 'saf-observation-1-2-property-2'];
  await Promise.all([page.goto(`/saf/apartment/${ids[0]}?tab=plan`), other.goto(`/saf/apartment/${ids[1]}?tab=plan`)]);
  await expect(page.locator('.saf-apartment-favorite')).toHaveAttribute('aria-pressed', 'false');
  await expect(other.locator('.saf-apartment-favorite')).toHaveAttribute('aria-pressed', 'false');
  for (const selection of [
    { key: 'saf-favorite-apartments', buttons: [page.locator('.saf-apartment-favorite'), other.locator('.saf-apartment-favorite')] },
    { key: 'saf-compare-apartments', buttons: [page.locator('.saf-apartment-actions button[aria-pressed]'), other.locator('.saf-apartment-actions button[aria-pressed]')] },
  ]) {
    for (const expected of [ids, []]) {
      await Promise.all(selection.buttons.map(button => button.evaluate(element => (element as HTMLButtonElement).click())));
      await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]').sort(), selection.key)).toEqual([...expected].sort());
      for (const button of selection.buttons) await expect(button).toHaveAttribute('aria-pressed', String(expected.length > 0));
    }
  }
  await Promise.all([page.goto('/saf'), other.goto('/saf')]);
  const cards = [page.locator('.saf-plan-card').nth(0), other.locator('.saf-plan-card').nth(1)];
  const codes = await Promise.all(cards.map(card => card.locator('small').innerText()));
  for (const selection of [
    { key: 'sensata-saf-saved-plans', buttons: cards.map(card => card.locator('.saf-plan-card-top button')) },
    { key: 'sensata-saf-compare-plans', buttons: cards.map(card => card.locator('.saf-plan-card-actions button')) },
  ]) {
    for (const expected of [codes, []]) {
      await Promise.all(selection.buttons.map(button => button.evaluate(element => (element as HTMLButtonElement).click())));
      await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]').sort(), selection.key)).toEqual([...expected].sort());
    }
  }
  await other.close();
  await page.reload();
  await page.getByLabel('Только подборка').check();
  await expect(page.getByRole('heading', { name: 'Планировки не найдены', exact: true })).toBeVisible();
  await expect(page.locator('.saf-compare-bar')).toHaveCount(0);
});

test('reload retains a selection while another tab delays storage coordination', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: () => new Promise(() => {}) } });
  });
  await page.goto('/saf/apartment/saf-observation-1-2-property-1?tab=plan');
  await page.getByRole('button', { name: 'Сохранить квартиру в избранное', exact: true }).click();
  await page.getByRole('button', { name: 'Сравнить', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Убрать квартиру из избранного', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Убрать из сравнения', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Моё избранное', exact: true }).click();
  await expect(page.locator('.saf-shortlist-cards article')).toHaveCount(1);
  await page.getByRole('link', { name: 'Смотреть сравнение (1)', exact: true }).click();
  await expect(page.locator('.saf-shortlist-table thead th')).toHaveCount(2);
});
