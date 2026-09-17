import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function loadSiteModule(base) {
  const result = await build({
    entryPoints: ['src/lib/site.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    define: {
      'import.meta.env.BASE_URL': JSON.stringify(base),
      'import.meta.env.VITE_STATIC_HOSTING': '"true"'
    }
  });

  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

test('Pages links retain the repository prefix and preserve external targets', async () => {
  const { siteUrl, sitePath } = await loadSiteModule('/Sansata/');

  const testCases = [
    ['/', '/Sansata/'],
    ['/flat/shattyq-1', '/Sansata/flat/shattyq-1'],
    ['/sensata/hero.jpg', '/Sansata/sensata/hero.jpg'],
    ['/Sansata/tour', '/Sansata/tour'],
    ['tel:700', 'tel:700'],
    ['https://sensata.kz', 'https://sensata.kz'],
    ['#gallery', '#gallery']
  ];

  for (const [input, expectedOutput] of testCases) {
    assert.equal(siteUrl(input), expectedOutput);
  }

  globalThis.location = { pathname: '/Sansata/flat/shattyq-1' };
  assert.equal(sitePath(), '/flat/shattyq-1');

  globalThis.location = { pathname: '/Sansata/' };
  assert.equal(sitePath(), '/');

  delete globalThis.location;
});

test('Local hosting keeps root paths', async () => {
  const { siteUrl } = await loadSiteModule('/');
  assert.equal(siteUrl('/sensata/hero.jpg'), '/sensata/hero.jpg');
});
