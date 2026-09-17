import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export * from './src/lib/journey'; export * from './src/lib/config'; export * from './src/lib/experience';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {journeyRoute,matchingPlans,flats,readDesign,defaultDesign,parseExperience,fallbackConfig}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
test('selection routes reject nonexistent sections and floors',()=>{
 assert.deepEqual(journeyRoute('/visual/section/2/floor/9'),{section:2,floor:9});
 for(const path of ['/visual/section/3','/visual/section/1/floor/0','/visual/section/1/floor/10','/visual/section/1/floor/2/extra'])assert.equal(journeyRoute(path),null);
 assert.deepEqual(journeyRoute('/visual'),{section:0,floor:0});
});
test('floor selection only returns published matching plans',()=>{
 const sample=flats[0]; const plans=matchingPlans(flats,sample.section,sample.floor,[sample.rooms]);
 assert.ok(plans.some(p=>p.id===sample.id));
 assert.ok(plans.every(p=>p.section===sample.section&&p.floor===sample.floor&&p.rooms===sample.rooms));
 assert.deepEqual(matchingPlans(flats,sample.section,sample.floor,[99]),[]);
});
test('saved interiors reject corrupt coordinates and duplicate furniture',()=>{
 assert.deepEqual(readDesign(defaultDesign),defaultDesign);
 for(const patch of [{wall:'red'},{furniture:[{...defaultDesign.furniture[0],x:Infinity}]},{furniture:[defaultDesign.furniture[0],defaultDesign.furniture[0]]}]) assert.equal(readDesign({...defaultDesign,...patch}),null);
});
test('apartment media validates nested panorama graphs and model URLs',()=>{
 assert.ok(parseExperience({...fallbackConfig,apartmentTours:{'shattyq-1':{modelUrl:'/models/a.glb',panoramas:[{id:'a',title:'Room',src:'/a.jpg'}]}}}).apartmentTours);
 for(const tour of [{modelUrl:'javascript:alert(1)'},{panoramas:[{id:'a',title:'Room',src:'/a.jpg',links:[{target:'missing',yaw:0,pitch:0}]}]}])assert.throws(()=>parseExperience({...fallbackConfig,apartmentTours:{a:tour}}));
});
test('selection polygons remain inside image coordinates with unique IDs',()=>{
 const image={image:'/floor.jpg',width:100,height:80,regions:[{id:'shattyq-1',points:[[0,0],[100,0],[100,80]]}]};
 assert.ok(parseExperience({...fallbackConfig,selectionMedia:{floorPlans:{'1-2':image}}}).selectionMedia);
 for(const regions of [[{id:'x',points:[[0,0],[101,0],[0,80]]}],[image.regions[0],image.regions[0]]])assert.throws(()=>parseExperience({...fallbackConfig,selectionMedia:{masterplan:{...image,regions}}}));
});
