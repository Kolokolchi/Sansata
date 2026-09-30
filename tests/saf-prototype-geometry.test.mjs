import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
const bundled=await build({stdin:{contents:"export * from './src/lib/safFloorGeometry'; export * from './src/lib/safInventory'; export * from './src/lib/geometry';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.glob':'__emptyGlob'},banner:{js:'const __emptyGlob=()=>({});'}});
const api=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));

test('approximate floor regions cover each real observation once, without duplicating or inventing apartments',()=>{
  let total=0;
  for(const [key,units] of api.safFloorUnits){
    const [section,floor]=key.split('/');const data=api.safFloorGeometry(section,Number(floor));
    assert.ok(data,`${key}: missing geometry`);
    const linked=data.regions.flatMap(r=>r.unit?[r.unit.id]:[]);
    assert.deepEqual([...linked].sort(),units.map(u=>u.id).sort(),key);
    assert.equal(new Set(linked).size,linked.length);
    for(const region of data.regions){
      assert.ok(region.points.length>=3);
      assert.ok(api.pointInPolygon({x:region.center[0],y:region.center[1]},region.points),`${key}: label outside region`);
      for(const [x,y] of region.points){assert.ok(x>=150&&x<=870&&y>=260&&y<=1140);}
    }
    total+=linked.length;
  }
  assert.equal(total,348);
  assert.equal(api.safFloorGeometry('1',99),null);
  const first=api.safFloorGeometry('1',2);
  const topLeft=first.regions.find(r=>r.unit.number==='1');
  const bottomRight=first.regions.find(r=>r.unit.number==='3');
  assert.ok(topLeft.center[0]<bottomRight.center[0]&&topLeft.center[1]<bottomRight.center[1]);
});

test('prototype facades use seven bounded polygons with labels inside the hit area',async()=>{
  const data=JSON.parse(await readFile('src/data/saf-prototype-sections.json','utf8'));
  assert.equal(data.accuracy,'prototype');
  assert.deepEqual(data.regions.map(r=>r.id).sort(),['1','2','3','4','5','6','7']);
  for(const region of data.regions){
    assert.ok(api.pointInPolygon(api.calculateCentroid(region.points),region.points),region.id);
    assert.equal(region.facade.length,4);
    for(const [x,y] of [...region.points,...region.facade])assert.ok(x>=0&&x<=1920&&y>=0&&y<=1080);
  }
});
