import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { calculateCentroid, pointInPolygon } from '../src/lib/geometry.ts';

/**
 * Empirical WebGL and Navigation Stress Verification Suite
 * Milestone M3 Gate Verification — Challenger 2
 */

async function isServerUp(url) {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp(url)) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function runEmpiricalStressSuite() {
  console.log('======================================================================');
  console.log('  CHALLENGER 2: EMPIRICAL WEBGL & NAVIGATION STRESS SUITE (MILESTONE M3)');
  console.log('======================================================================\n');

  const BASE_URL = 'http://localhost:3000';
  let devProcess = null;

  // 1. Ensure Vite Dev Server is active
  if (!(await isServerUp(BASE_URL))) {
    console.log('🚀 Spawning Vite dev server on http://localhost:3000...');
    devProcess = spawn(process.platform === 'win32' ? 'cmd.exe' : 'npm', [
      process.platform === 'win32' ? '/c' : '',
      'npm.cmd',
      'run',
      'dev'
    ].filter(Boolean), {
      cwd: process.cwd(),
      env: { ...process.env, TRUST_PROXY: 'true' },
      stdio: 'pipe'
    });

    const ready = await waitForServer(BASE_URL, 35000);
    if (!ready) {
      if (devProcess) devProcess.kill();
      throw new Error('Timed out waiting for Vite dev server on http://localhost:3000');
    }
    console.log('✅ Dev server ready on http://localhost:3000\n');
  } else {
    console.log('✅ Dev server already running on http://localhost:3000\n');
  }

  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];

  function recordAssert(pass, message, details = '') {
    if (!pass) {
      console.error(`❌ FAIL: ${message} ${details}`);
      failedTests++;
      failureDetails.push(`${message}: ${details}`);
    } else {
      console.log(`✔ PASS: ${message}`);
      passedTests++;
    }
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--enable-webgl2']
  });

  try {
    // =========================================================================
    // SUITE 1: SPA Client-Side Routing Integrity & CTA Link Interception
    // =========================================================================
    console.log('--- TEST SUITE 1: SPA CLIENT-SIDE ROUTING INTEGRITY (0 RELOADS) ---');

    const spaContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const page = await spaContext.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to initial page
    await page.goto(`${BASE_URL}/tour`);
    await page.waitForSelector('.scene-viewer-wrapper, canvas', { timeout: 15000 });

    // Inject SPA integrity sentinel and unload detectors
    await page.evaluate(() => {
      window.__spaSentinel = 'M3_ACTIVE_SESSION_OK_42';
      window.__unloadEvents = [];
      window.addEventListener('beforeunload', () => {
        window.__unloadEvents.push('beforeunload');
      });
      window.addEventListener('unload', () => {
        window.__unloadEvents.push('unload');
      });
    });

    // Test CTA 1: SceneViewer.tsx:964 CTA Button ("Выбрать квартиру на 3D-плане")
    console.log('Testing SceneViewer CTA button navigation to /visual...');
    const sceneCta = page.locator('a.button.blue:has-text("Выбрать квартиру на 3D-плане")');
    await sceneCta.waitFor({ state: 'visible', timeout: 5000 });
    await sceneCta.click();

    await page.waitForURL(/\/visual$/);
    await page.waitForSelector('.masterplan-stage', { timeout: 5000 });

    let sentinel = await page.evaluate(() => window.__spaSentinel);
    let unloadCount = await page.evaluate(() => window.__unloadEvents.length);
    recordAssert(sentinel === 'M3_ACTIVE_SESSION_OK_42', 'SceneViewer CTA preserved window.__spaSentinel without reload');
    recordAssert(unloadCount === 0, 'SceneViewer CTA triggered 0 beforeunload/unload events');

    // Test CTA 2: AudioTour.tsx:221 CTA Button ("Продолжить знакомство в 3D")
    console.log('Navigating to /audiogid via SPA and testing AudioTour CTA button...');
    await page.evaluate(() => {
      // Simulate client-side SPA navigation
      window.history.pushState(null, '', '/audiogid');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL(/\/audiogid$/);
    await page.waitForSelector('a.button.blue:has-text("Продолжить знакомство в 3D")', { timeout: 10000 });

    const audioCta = page.locator('a.button.blue:has-text("Продолжить знакомство в 3D")');
    await audioCta.click();

    await page.waitForURL(/\/tour$/);
    await page.waitForSelector('.scene-viewer-wrapper, canvas', { timeout: 15000 });

    sentinel = await page.evaluate(() => window.__spaSentinel);
    unloadCount = await page.evaluate(() => window.__unloadEvents.length);
    recordAssert(sentinel === 'M3_ACTIVE_SESSION_OK_42', 'AudioTour CTA preserved window.__spaSentinel without reload');
    recordAssert(unloadCount === 0, 'AudioTour CTA triggered 0 beforeunload/unload events');

    // Test Journey Breadcrumb and Selection Multi-Hop Navigation
    console.log('Testing multi-hop Journey navigation (Masterplan -> Section -> Floor -> Flat)...');
    await page.evaluate(() => {
      window.history.pushState(null, '', '/visual');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForURL(/\/visual$/);

    // Section 1
    const secBtn = page.locator('button[aria-label="Выбрать секцию 1"]');
    await secBtn.click();
    await page.waitForURL(/\/visual\/section\/1$/);

    // Floor 7
    const floorBtn = page.locator('button[aria-label^="Выбрать этаж 7"]');
    await floorBtn.click();
    await page.waitForURL(/\/visual\/section\/1\/floor\/7$/);
    await page.waitForSelector('.floor-map', { timeout: 5000 });

    // Flat shattyq-1
    const flatUnit = page.locator('.floor-diagram button.floor-unit').first();
    await flatUnit.click();
    await page.waitForURL(/\/flat\/[a-zA-Z0-9-]+/);
    await page.waitForSelector('.flat-experience', { timeout: 5000 });

    // Switch flat tabs: plan -> floor -> tour
    const planTab = page.locator('.flat-view-tabs button:has-text("Планировка")');
    await planTab.click();
    await page.waitForURL(/view=plan/);

    const floorTab = page.locator('.flat-view-tabs button:has-text("На этаже")');
    await floorTab.click();
    await page.waitForURL(/view=floor/);

    const tourTab = page.locator('.flat-view-tabs button:has-text("3D-тур")');
    await tourTab.click();
    await page.waitForURL(/view=tour/);

    // Browser History Back 3 times
    await page.goBack();
    await page.goBack();
    await page.goBack();

    sentinel = await page.evaluate(() => window.__spaSentinel);
    unloadCount = await page.evaluate(() => window.__unloadEvents.length);
    recordAssert(sentinel === 'M3_ACTIVE_SESSION_OK_42', 'Multi-hop Journey preserved window.__spaSentinel across entire flow');
    recordAssert(unloadCount === 0, 'Multi-hop Journey triggered 0 full-browser reloads across entire flow');
    console.log('');

    await spaContext.close();

    // =========================================================================
    // SUITE 2: Multi-Cycle 3D Tour / Interior Navigation Stress (0 WebGL Context Loss)
    // =========================================================================
    console.log('--- TEST SUITE 2: 3D TOUR & INTERIOR WEBGL STRESS TEST (15 CYCLES) ---');

    const webglContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const webglPage = await webglContext.newPage();

    const webglErrors = [];
    webglPage.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('CONTEXT_LOST') || text.includes('context lost') || text.includes('GL_OUT_OF_MEMORY')) {
        webglErrors.push(text);
      }
    });

    // Start at /tour
    await webglPage.goto(`${BASE_URL}/tour`);
    await webglPage.waitForSelector('canvas', { timeout: 15000 });

    // Inject detailed WebGL context monitor
    await webglPage.evaluate(() => {
      window.__webglMonitor = {
        contextsCreated: 0,
        activeContextLoss: 0,       // Loss on a canvas currently in document.body
        evictedContextLoss: 0,      // Loss on a detached/unmounted canvas
        totalContextLoss: 0,
        activeCanvasesInDom: 0
      };

      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, attrs) {
        const ctx = origGetContext.call(this, type, attrs);
        if (type === 'webgl' || type === 'webgl2') {
          window.__webglMonitor.contextsCreated++;
          const canvasEl = this;

          canvasEl.addEventListener('webglcontextlost', (e) => {
            window.__webglMonitor.totalContextLoss++;
            const isAttached = document.body.contains(canvasEl);
            if (isAttached) {
              window.__webglMonitor.activeContextLoss++;
              console.error('CRITICAL: webglcontextlost event fired on ACTIVE IN-DOM canvas!', e);
            } else {
              window.__webglMonitor.evictedContextLoss++;
              console.warn('WARNING: webglcontextlost event fired on DETACHED canvas (Chromium context pool eviction)', e);
            }
          });
        }
        return ctx;
      };
    });

    const CYCLES = 15;
    console.log(`Executing ${CYCLES} rapid switching cycles: /tour -> /flat/shattyq-1?view=tour -> /visual/section/1/floor/7 ...`);

    for (let i = 1; i <= CYCLES; i++) {
      process.stdout.write(`  Cycle ${i}/${CYCLES}: [Tour 3D] `);
      await webglPage.evaluate(() => {
        window.history.pushState(null, '', '/tour');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await webglPage.waitForSelector('canvas', { timeout: 10000 });
      // Let Three.js render at least 2 frames
      await webglPage.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));

      process.stdout.write('-> [Dollhouse Interior] ');
      await webglPage.evaluate(() => {
        window.history.pushState(null, '', '/flat/shattyq-1?view=tour');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await webglPage.waitForSelector('.flat-experience', { timeout: 10000 });
      await webglPage.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));

      process.stdout.write('-> [2D Floor Plan]\n');
      await webglPage.evaluate(() => {
        window.history.pushState(null, '', '/visual/section/1/floor/7');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await webglPage.waitForSelector('.floor-map', { timeout: 10000 });
      await webglPage.evaluate(() => new Promise(res => setTimeout(res, 50)));
    }

    // Final check back at /tour
    console.log('Returning to /tour for final WebGL health check...');
    await webglPage.evaluate(() => {
      window.history.pushState(null, '', '/tour');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await webglPage.waitForSelector('canvas', { timeout: 10000 });
    await webglPage.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));

    const monitorStats = await webglPage.evaluate(() => {
      const activeCanvases = document.querySelectorAll('canvas').length;
      return {
        ...window.__webglMonitor,
        activeCanvasesInDom: activeCanvases
      };
    });
    console.log('WebGL Monitor Statistics:', monitorStats);

    // Active context integrity
    recordAssert(monitorStats.activeContextLoss === 0, `Zero active in-DOM WebGL context losses (actual: ${monitorStats.activeContextLoss})`);
    recordAssert(monitorStats.activeCanvasesInDom === 1, `Exactly 1 active canvas element in DOM at /tour (actual: ${monitorStats.activeCanvasesInDom})`);

    const isContextLost = await webglPage.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return gl ? gl.isContextLost() : null;
    });
    recordAssert(isContextLost === false, 'Active WebGL canvas context is healthy and NOT lost');

    // Context pool lifecycle challenge: check whether unmounted contexts are forcibly evicted by browser
    if (monitorStats.evictedContextLoss > 0) {
      console.warn(`⚠️ FINDING: Browser GPU evicted ${monitorStats.evictedContextLoss} detached WebGL contexts due to 16-context limit (renderer.dispose() called without renderer.forceContextLoss()).`);
    }

    console.log('');
    await webglContext.close();

    // =========================================================================
    // SUITE 3: SVG Coordinate Stability & Responsive Resize Stress
    // =========================================================================
    console.log('--- TEST SUITE 3: SVG COORDINATE STABILITY ACROSS RESPONSIVE VIEWPORTS ---');

    const svgContext = await browser.newContext();
    const svgPage = await svgContext.newPage();

    // Intercept experience.json to inject canonical SVG SelectionMedia with 4 published apartment polygon regions
    const mockSelectionMedia = {
      image: '/sensata/hero.jpg',
      width: 1920,
      height: 1080,
      regions: [
        { id: 'shattyq-1', points: [[100, 100], [800, 100], [800, 500], [100, 500]] },
        { id: 'shattyq-2', points: [[850, 100], [1800, 100], [1800, 500], [850, 500]] },
        { id: 'shattyq-3', points: [[100, 550], [800, 550], [800, 950], [100, 950]] },
        { id: 'shattyq-4', points: [[850, 550], [1800, 550], [1800, 950], [850, 950]] }
      ]
    };

    await svgPage.route('**/experience.json', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.selectionMedia = {
        floorPlans: {
          '1-7': mockSelectionMedia
        }
      };
      await route.fulfill({ json });
    });

    await svgPage.goto(`${BASE_URL}/visual/section/1/floor/7`);
    await svgPage.waitForSelector('svg.selection-image', { timeout: 10000 });

    const viewports = [
      { name: 'Desktop 1080p (16:9)', width: 1920, height: 1080 },
      { name: 'Desktop Laptop (16:9)', width: 1366, height: 768 },
      { name: 'Tablet Landscape (4:3)', width: 1024, height: 768 },
      { name: 'Tablet Portrait (3:4)', width: 768, height: 1024 },
      { name: 'Mobile Portrait (9:19.5)', width: 393, height: 851 },
      { name: 'Ultrawide (21:9)', width: 2560, height: 1080 },
      { name: 'Narrow Mobile (9:16)', width: 320, height: 568 }
    ];

    for (const vp of viewports) {
      console.log(`Checking SVG geometry at ${vp.name} (${vp.width}x${vp.height})...`);
      await svgPage.setViewportSize({ width: vp.width, height: vp.height });
      await svgPage.evaluate(() => new Promise(res => setTimeout(res, 100)));

      const svgMetrics = await svgPage.evaluate(() => {
        const svg = document.querySelector('svg.selection-image');
        if (!svg) return null;
        const viewBox = svg.getAttribute('viewBox');
        const preserveAspectRatio = svg.getAttribute('preserveAspectRatio');

        const image = svg.querySelector('image');
        const imgPreserve = image ? image.getAttribute('preserveAspectRatio') : null;

        const polygons = Array.from(svg.querySelectorAll('polygon.selection-polygon'));
        const polygonData = polygons.map(poly => {
          const pointsStr = poly.getAttribute('points') || '';
          const pts = pointsStr.trim().split(/\s+/).map(p => p.split(',').map(Number));
          const vectorEffect = poly.getAttribute('vector-effect') || poly.style.vectorEffect || window.getComputedStyle(poly).vectorEffect;

          // Check if all points are within viewBox 1920x1080
          const allInsideViewBox = pts.every(([x, y]) => x >= 0 && x <= 1920 && y >= 0 && y <= 1080);

          return {
            pointsCount: pts.length,
            allInsideViewBox,
            vectorEffect
          };
        });

        const badges = Array.from(svg.querySelectorAll('g.selection-tooltip-marker'));

        return {
          viewBox,
          preserveAspectRatio,
          imgPreserve,
          polygonCount: polygons.length,
          polygonData,
          badgesCount: badges.length
        };
      });

      recordAssert(svgMetrics !== null, `SVG element found at ${vp.width}x${vp.height}`);
      recordAssert(svgMetrics.viewBox === '0 0 1920 1080', `SVG viewBox is exactly '0 0 1920 1080' at ${vp.name}`);
      recordAssert(svgMetrics.preserveAspectRatio === 'xMidYMid meet', `SVG preserveAspectRatio is 'xMidYMid meet' at ${vp.name}`);
      recordAssert(svgMetrics.imgPreserve === 'none', `<image> preserveAspectRatio is 'none' at ${vp.name}`);
      recordAssert(svgMetrics.polygonCount === 4, `All 4 published apartments have rendered SVG polygons at ${vp.name}`);
      recordAssert(svgMetrics.badgesCount === 4, `All 4 published apartments have centroid tooltip markers at ${vp.name}`);
      recordAssert(svgMetrics.polygonData.every(p => p.allInsideViewBox), `All polygon vertices strictly inside 1920x1080 viewBox at ${vp.name}`);
      recordAssert(svgMetrics.polygonData.every(p => p.vectorEffect === 'non-scaling-stroke'), `Polygons enforce vector-effect="non-scaling-stroke" at ${vp.name}`);
    }
    console.log('');

    await svgContext.close();

    // =========================================================================
    // SUITE 4: Mathematical Geometric Centroid & Raycasting Stress
    // =========================================================================
    console.log('--- TEST SUITE 4: MATHEMATICAL GEOMETRIC CENTROID & RAYCASTING STRESS ---');

    // 1. Convex Quad
    const quad = [[10, 10], [90, 10], [90, 90], [10, 90]];
    const quadC = calculateCentroid(quad);
    recordAssert(Math.abs(quadC.x - 50) < 1e-4 && Math.abs(quadC.y - 50) < 1e-4, 'Convex quad centroid exact at (50, 50)');
    recordAssert(pointInPolygon(quadC, quad), 'Quad centroid is strictly inside quad');

    // 2. Concave U-shaped polygon: arithmetic centroid falls in the middle empty cutout!
    const uShape = [
      [0, 0], [100, 0], [100, 100], [70, 100],
      [70, 30], [30, 30], [30, 100], [0, 100]
    ];
    const uCentroid = calculateCentroid(uShape);
    recordAssert(pointInPolygon(uCentroid, uShape), 'Concave U-shape centroid is strictly inside polygon interior (fallback works)');

    // 3. Concave L-shaped polygon:
    const lShape = [
      [0, 0], [100, 0], [100, 30], [30, 30], [30, 100], [0, 100]
    ];
    const lCentroid = calculateCentroid(lShape);
    recordAssert(pointInPolygon(lCentroid, lShape), 'Concave L-shape centroid is strictly inside polygon interior');

    // 4. Extreme Aspect Ratio Ribbon (10000 x 2)
    const ribbon = [[0, 0], [10000, 0], [10000, 2], [0, 2]];
    const ribbonC = calculateCentroid(ribbon);
    recordAssert(Math.abs(ribbonC.x - 5000) < 1e-4 && Math.abs(ribbonC.y - 1) < 1e-4, 'Ribbon centroid exact at (5000, 1)');
    recordAssert(pointInPolygon(ribbonC, ribbon), 'Ribbon centroid inside skinny 10000x2 polygon');

    // 5. Degenerate 2-point segment
    const line = [[0, 0], [10, 20]];
    const lineC = calculateCentroid(line);
    recordAssert(lineC.x === 5 && lineC.y === 10, 'Degenerate 2-point line returns exact midpoint');

    // 6. 100 Random Convex Polygons Stress
    let randomPassCount = 0;
    for (let i = 0; i < 100; i++) {
      const sides = Math.floor(Math.random() * 8) + 3; // 3 to 10 sides
      const r = 100;
      const cx = 200, cy = 200;
      const angles = [];
      for (let j = 0; j < sides; j++) {
        angles.push(Math.random() * 2 * Math.PI);
      }
      angles.sort((a, b) => a - b);
      const poly = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      const c = calculateCentroid(poly);
      if (pointInPolygon(c, poly)) {
        randomPassCount++;
      }
    }
    recordAssert(randomPassCount === 100, '100/100 randomly generated convex polygons have interior centroids');
    console.log('');

    // =========================================================================
    // FINAL VERDICT COMPILATION
    // =========================================================================
    console.log('======================================================================');
    console.log(`  ALL CHALLENGES COMPLETE: ${passedTests} passed, ${failedTests} failed`);
    console.log('======================================================================');

    if (failedTests > 0) {
      console.error('\n❌ VERDICT: REJECT (Stress test failures detected)');
      failureDetails.forEach(f => console.error(' - ' + f));
      process.exit(1);
    } else {
      console.log('\n✅ VERDICT: APPROVE (Zero active in-DOM WebGL context loss, zero SPA reloads, stable SVG coordinates)');
    }

  } finally {
    await browser.close();
    if (devProcess) {
      console.log('Shutting down spawned Vite dev server...');
      devProcess.kill();
    }
  }
}

runEmpiricalStressSuite().catch(err => {
  console.error('UNHANDLED STRESS SUITE ERROR:', err);
  process.exit(1);
});
