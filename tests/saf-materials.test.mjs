import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('SAF local media exactly preserves original content and covers every published plan', async () => {
  const media = JSON.parse(await readFile('src/data/saf-materials.json', 'utf8'));
  const plans = JSON.parse(await readFile('src/data/saf-plans.json', 'utf8')).plans;
  const sources = new Set(media.assets.map(item => item.source));
  assert.equal(media.brochures.length, 2);
  for (const plan of plans) assert.ok(sources.has(plan.image), `missing ${plan.code}`);
  for (const section of media.sections) for (const url of section.urls) assert.ok(sources.has(url));
  for (const asset of media.assets) {
    assert.ok(!new URL(asset.source).search, 'media URL must have no access parameters');
    assert.match(asset.file, /^[a-f0-9]{16}\.(png|jpe?g|pdf|svg)$/);
    const bytes = await readFile(`src/assets/saf-avenue/${asset.file}`);
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
  }
  const documents = JSON.parse(await readFile('src/data/saf-brochures.json', 'utf8'));
  for (const document of documents) for (let page = 1; page <= document.pages; page++) {
    assert.ok((await stat(`src/assets/saf-brochures/${document.id}-${String(page).padStart(2, '0')}.jpg`)).size > 1000);
  }
});

test('public stock observations keep historical evidence separate from live inventory and CRM', async () => {
  const snapshot = JSON.parse(await readFile('src/data/saf-stock-snapshot.json', 'utf8'));
  const codes = new Set(JSON.parse(await readFile('src/data/saf-plans.json', 'utf8')).plans.map(plan => plan.code));
  const ids = new Set();
  for (const item of snapshot.observations) {
    assert.deepEqual(Object.keys(item).sort(), ['id','number','section','floor','rooms','area','kind','observedStatus','observedPrice','planCode','status','price'].sort());
    assert.match(item.id, /^saf-observation-/);
    assert.ok(!ids.has(item.id)); ids.add(item.id);
    assert.equal(item.status, 'unknown'); assert.equal(item.price, null);
    assert.ok(['available','reserved','sold','unknown'].includes(item.observedStatus));
    assert.ok(item.observedPrice === null || item.observedPrice > 0);
    assert.ok(Number.isInteger(item.floor) && item.floor >= 1 && item.floor <= 13);
    assert.ok(item.planCode === null || codes.has(item.planCode));
    if (item.section === '8') assert.equal(item.kind, 'commercial');
  }
  assert.equal(snapshot.observations.length, 364);
  assert.equal(snapshot.observations.filter(item => item.kind === 'residential').length, 348);
  assert.equal(snapshot.observations.filter(item => item.planCode).length, 269);
  assert.equal(snapshot.floorGeometryAvailable, false);
});
