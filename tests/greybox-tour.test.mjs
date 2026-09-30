import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { FloatType } from 'three';

const root = new URL('../src/sandbox/', import.meta.url);
const layout = JSON.parse(await readFile(new URL('greybox-layout.json', root), 'utf8'));

test('Greybox graph is connected and walking paths clear furniture and walls', () => {
  const byId = new Map(layout.nodes.map(node => [node.id, node]));
  const visited = new Set();
  const visit = id => {
    if (visited.has(id)) return;
    visited.add(id);
    const from = byId.get(id);
    for (const toId of from.links) {
      const to = byId.get(toId);
      assert.ok(to, `Missing destination ${toId}`);
      assert.ok(to.links.includes(id), `No return path ${toId} → ${id}`);
      for (let step = 0; step <= 100; step++) {
        const t = step / 100;
        const x = from.position[0] * (1 - t) + to.position[0] * t;
        const z = from.position[2] * (1 - t) + to.position[2] * t;
        for (const box of layout.boxes) {
          if (box.max[1] <= .06 || box.min[1] >= 1.8) continue;
          const blocked = x > box.min[0] - .12 && x < box.max[0] + .12 && z > box.min[2] - .12 && z < box.max[2] + .12;
          assert.equal(blocked, false, `${id} → ${toId} intersects ${box.material} at ${t}`);
        }
      }
      visit(toId);
    }
  };
  visit('living');
  assert.equal(visited.size, layout.nodes.length);
});

test('All six local panoramas decode as real 2:1 HDR with values above SDR white', async () => {
  const loader = new HDRLoader().setDataType(FloatType);
  for (const node of layout.nodes) {
    assert.ok(Number.isFinite(node.panoramaYaw));
    const file = await readFile(new URL(`hdri/${node.panoramaFile}`, root));
    const decoded = loader.parse(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength));
    assert.equal(decoded.width, decoded.height * 2);
    assert.ok(decoded.width >= 1536);
    let peak = 0;
    for (const value of decoded.data) {
      assert.ok(Number.isFinite(value));
      peak = Math.max(peak, value);
    }
    assert.ok(peak > 1, `${node.id} has no HDR radiance`);
    const preview = await readFile(new URL(`hdri/${node.previewFile}`, root));
    assert.equal(preview.readUInt32BE(16), preview.readUInt32BE(20) * 2);
  }
});
