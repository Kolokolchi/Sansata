import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundled=await build({stdin:{contents:"export * from './src/lib/config'; export * from './src/lib/experience';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {parseExperience,fallbackConfig,calculateMortgage,flats}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
test('config accepts connected panoramas and limits inventory to public fields',()=>{
 const c=parseExperience({...fallbackConfig,panoramas:[{id:'a',title:'A',src:'/a.jpg',links:[{target:'b',yaw:0,pitch:0}]},{id:'b',title:'B',src:'/b.jpg'}],inventory:[{id:'shattyq-1',price:50000000,status:'available',image:'https://wrong.example/image'}]});
 assert.equal(c.panoramas.length,2);assert.equal(c.inventory[0].price,50000000);assert.equal(c.inventory[0].image,undefined);
});
test('config rejects broken arrays, protocols, linked ids and values',()=>{
 for(const patch of [{version:2},{inventory:null},{model:{url:'javascript:alert(1)',label:'x',scale:1}},{inventory:[{id:'x',price:-1}]},{panoramas:[{id:'a',title:'A',src:'/a.jpg',links:[{target:'missing',yaw:0,pitch:0}]}]}])assert.throws(()=>parseExperience({...fallbackConfig,...patch}));
});
test('mortgage handles zero rate, full payment and annuity reference',()=>{
 assert.equal(calculateMortgage(1200000,0,1,0).payment,100000);
 assert.equal(calculateMortgage(1200000,1200000,1,18).payment,0);
 assert.ok(Math.abs(calculateMortgage(1000000,0,1,12).payment-88848.7887)<.01);
});
test('catalogue contains unique original plans and no invented prices',()=>{
 assert.equal(flats.length,20);assert.equal(new Set(flats.map(f=>f.id)).size,20);
 assert.ok(flats.every(f=>f.price===null&&f.status==='unknown'));
 assert.equal(flats.filter(f=>f.rooms===4&&f.floor===2).length,1);
});
