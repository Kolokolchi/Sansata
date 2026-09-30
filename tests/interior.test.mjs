import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({entryPoints:['src/lib/interior.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {readDesign,defaultDesign}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('saved interiors reject corrupt coordinates and duplicate furniture',()=>{
 assert.deepEqual(readDesign(defaultDesign),defaultDesign);
 for(const patch of [{wall:'red'},{furniture:[{...defaultDesign.furniture[0],x:Infinity}]},{furniture:[defaultDesign.furniture[0],defaultDesign.furniture[0]]}]) assert.equal(readDesign({...defaultDesign,...patch}),null);
});
