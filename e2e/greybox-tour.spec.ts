import { expect, test, type Page } from '@playwright/test';

async function settled(page: Page, point: string, mode = 'hdr') {
  await expect.poll(async () => {
    const value = await page.locator('.greybox-tour__viewport').getAttribute('data-metrics');
    const state = JSON.parse(value || '{}');
    return { point: state.point, moving: state.moving, mode: state.mode };
  }).toEqual({ point, moving: false, mode });
}

test('Greybox walking, panorama/model, hover, drag, touch, keyboard and history', async ({ page }, info) => {
  test.setTimeout(75000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    // Headless Chromium's screenshot readback warning is emitted by its GL driver.
    if (/GL Driver Message.*GPU stall due to ReadPixels/.test(message.text())) return;
    if (['error', 'warning'].includes(message.type())) errors.push(message.text());
  });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/sandbox/greybox-tour');
  await settled(page, 'living');
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const canvas = page.locator('canvas');
  const size = page.viewportSize()!;
  if (info.project.use.hasTouch || info.project.name === 'Mobile') {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: size.width * .7, y: size.height * .4 }] });
    for (let step = 1; step <= 8; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: size.width * (.7 - step * .05), y: size.height * .4 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(size.width * .7, size.height * .4);
    await page.mouse.down();
    await page.mouse.move(size.width * .3, size.height * .4, { steps: 10 });
    await page.mouse.up();
  }
  await expect.poll(async () => JSON.parse((await page.locator('.greybox-tour__viewport').getAttribute('data-metrics'))!).yaw).not.toBe(115);
  await page.getByRole('button', { name: 'Сбросить ракурс' }).click();
  await canvas.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => JSON.parse((await page.locator('.greybox-tour__viewport').getAttribute('data-metrics'))!).yaw).toBe(103);
  await page.getByRole('button', { name: 'Сбросить ракурс' }).click();
  const ring = page.getByRole('button', { name: 'Перейти: Зона отдыха', exact: true });
  if (await ring.isVisible()) {
    if (!info.project.use.hasTouch && info.project.name !== 'Mobile') {
      const before = (await ring.boundingBox())!.width;
      await ring.hover();
      await expect.poll(async () => (await ring.boundingBox())!.width).toBeGreaterThan(before);
    }
    await ring.click();
  } else await page.getByRole('navigation').getByRole('button', { name: 'Зона отдыха' }).click();
  await settled(page, 'lounge');
  const arrival = JSON.parse((await page.locator('.greybox-tour__viewport').getAttribute('data-metrics'))!);
  expect(arrival.yaw).toBe(115);
  expect(arrival.pitch).toBe(-5);
  await expect(page).toHaveURL(/point=lounge/);
  await page.goBack();
  await settled(page, 'living');
  await page.getByRole('button', { name: 'Показать Greybox модель' }).click();
  await settled(page, 'living', 'model');
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'Показать HDRI' }).click();
  await settled(page, 'living');
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(3);
  for (const [name, id] of [['Кухня', 'kitchen'], ['Гостиная', 'living'], ['Коридор', 'hall'], ['Прихожая', 'entry'], ['Коридор', 'hall'], ['Спальня', 'bedroom']]) {
    const button = page.getByRole('navigation').getByRole('button', { name });
    if (info.project.use.hasTouch || info.project.name === 'Mobile') await button.tap();
    else await button.click();
    await settled(page, id);
  }
  await page.reload();
  await settled(page, 'bedroom');
  await page.goBack();
  await page.waitForFunction(() => JSON.parse(document.querySelector<HTMLElement>('.greybox-tour__viewport')?.dataset.metrics || '{}').moving);
  await page.goForward();
  await settled(page, 'bedroom');
  await expect(page).toHaveURL(/point=bedroom/);
  await page.screenshot({ path: `output/greybox-${info.project.name.replaceAll(' ', '-').toLowerCase()}.png` });
  expect(errors).toEqual([]);
});

test('Walls select a nearby scan, preserve heading, and dragging never walks', async ({ page }, info) => {
  await page.goto('/sandbox/greybox-tour');
  await settled(page, 'living');
  const viewport = page.locator('.greybox-tour__viewport');
  const size = page.viewportSize()!;
  const x = size.width * .625;
  const y = size.height * .35;
  await page.mouse.move(x, y);
  await expect(viewport).toHaveAttribute('data-surface-target', 'lounge');
  if (info.project.use.hasTouch || info.project.name === 'Mobile') await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await settled(page, 'lounge');
  let state = JSON.parse((await viewport.getAttribute('data-metrics'))!);
  expect([state.yaw, state.pitch]).toEqual([115, -5]);
  await page.getByRole('navigation').getByRole('button', { name: 'Гостиная' }).click();
  await settled(page, 'living');
  state = JSON.parse((await viewport.getAttribute('data-metrics'))!);
  expect([state.yaw, state.pitch]).toEqual([115, -5]);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y + 30, { steps: 8 });
  await page.mouse.move(x, y, { steps: 8 });
  await page.mouse.up();
  await settled(page, 'living');
  await page.getByRole('button', { name: 'Показать Greybox модель' }).click();
  await settled(page, 'living', 'model');
  await page.mouse.click(x, y);
  await settled(page, 'lounge', 'model');
  await page.getByRole('button', { name: 'Показать HDRI' }).click();
  await settled(page, 'lounge');
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(1);
});

test('Greybox delayed HDR upgrades after landing and missing assets retain navigation', async ({ page }) => {
  await page.route(/bedroom.*\.hdr(?:\?|$)/, async route => {
    if (route.request().resourceType() === 'script') { await route.continue(); return; }
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.continue();
  });
  await page.goto('/sandbox/greybox-tour?point=hall');
  await settled(page, 'hall');
  await page.getByRole('navigation').getByRole('button', { name: 'Спальня' }).click();
  await settled(page, 'bedroom');
  await page.unrouteAll({ behavior: 'wait' });
  await page.route(/bedroom.*\.(hdr|png)(?:\?|$)/, route => route.request().resourceType() === 'script' ? route.continue() : route.abort());
  await page.goto('/sandbox/greybox-tour?point=bedroom');
  await expect(page.getByRole('status')).toContainText('Панорама недоступна');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('navigation').getByRole('button', { name: 'Коридор' }).click();
  await settled(page, 'hall');
  await page.goto('/sandbox/greybox-tour?point=missing');
  await settled(page, 'living');
});

test('Markers persist in both modes and a distant wall selects the nearest scan beyond the next room', async ({ page }) => {
  await page.goto('/sandbox/greybox-tour?point=hall');
  await settled(page, 'hall');
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Показать Greybox модель' })).toHaveText('HDRI');
  await page.getByRole('button', { name: 'Показать Greybox модель' }).click();
  await settled(page, 'hall', 'model');
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Показать HDRI' })).toHaveText('3D');
  await page.getByRole('button', { name: 'Показать HDRI' }).click();
  await settled(page, 'hall');
  const size = page.viewportSize()!;
  await page.mouse.move(size.width / 2, size.height * .48);
  await expect(page.locator('.greybox-tour__viewport')).toHaveAttribute('data-surface-target', 'lounge');
  const recording = page.locator('.greybox-tour__viewport').evaluate(element => new Promise<Array<{ time: number; position: number[]; moving: boolean; opacity: number; panoramaVisible: boolean; geometryVisible: boolean; calls: number }>>(resolve => {
    const samples: Array<{ time: number; position: number[]; moving: boolean; opacity: number; panoramaVisible: boolean; geometryVisible: boolean; calls: number }> = [];
    const started = performance.now();
    const tick = () => {
      const sample = JSON.parse((element as HTMLElement).dataset.flight || '{}');
      if (sample.moving && sample.time !== samples[samples.length - 1]?.time) samples.push(sample);
      if ((!sample.moving && samples.length) || performance.now() - started > 8000) resolve(samples);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  await page.mouse.click(size.width / 2, size.height * .48);
  await settled(page, 'lounge');
  const flight = await recording;
  expect(flight.length).toBeGreaterThan(5);
  for (let i = 1; i < flight.length; i++) {
    const a = flight[i - 1];
    const b = flight[i];
    const speed = Math.hypot(...b.position.map((value, axis) => value - a.position[axis])) / ((b.time - a.time) / 1000);
    expect(speed).toBeGreaterThan(3.4);
    expect(speed).toBeLessThan(3.61);
  }
  const crossing = flight.filter(sample => Math.abs(sample.position[0] - .85) < .4);
  expect(crossing.length).toBeGreaterThan(0);
  expect(flight.every(sample => sample.opacity === 1 && sample.panoramaVisible && !sample.geometryVisible && sample.calls <= 2)).toBe(true);
  const state = JSON.parse((await page.locator('.greybox-tour__viewport').getAttribute('data-metrics'))!);
  expect([state.yaw, state.pitch]).toEqual([90, -5]);
  await expect(page).toHaveURL(/point=lounge/);
  await expect(page.locator('.greybox-tour__marker:visible')).toHaveCount(1);
});

test('HDR flight waits for previews and never exposes collision geometry on texture failure', async ({ page }) => {
  await page.route(/bedroom.*\.(hdr|png)(?:\?|$)/, async route => {
    if (route.request().resourceType() === 'script') { await route.continue(); return; }
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.abort();
  });
  await page.goto('/sandbox/greybox-tour?point=hall');
  await settled(page, 'hall');
  await page.getByRole('navigation').getByRole('button', { name: 'Спальня' }).click();
  const flight = await page.locator('.greybox-tour__viewport').evaluate(element => JSON.parse((element as HTMLElement).dataset.flight!));
  expect(flight.geometryVisible).toBe(false);
  expect(flight.panoramaVisible).toBe(true);
  await expect(page.getByRole('status')).toContainText('Не удалось загрузить панорамы');
  await settled(page, 'hall');
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Прихожая' })).toBeEnabled();
  const after = await page.locator('.greybox-tour__viewport').evaluate(element => JSON.parse((element as HTMLElement).dataset.flight!));
  expect(after.geometryVisible).toBe(false);
  expect(after.panoramaVisible).toBe(true);
});
