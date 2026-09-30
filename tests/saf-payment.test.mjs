import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result=await build({entryPoints:['src/lib/safPayment.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {monthlyPayment}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));

test('payment schedule repays principal with interest and handles zero-interest and full deposit',()=>{
  const principal=10000000,rate=.12/12,months=120;
  const payment=monthlyPayment(12000000,2000000,12,10);
  let outstanding=principal;
  for(let month=0;month<months;month++)outstanding=outstanding*(1+rate)-payment;
  assert.ok(Math.abs(outstanding)<.001);
  assert.equal(monthlyPayment(12000000,2000000,0,10),principal/months);
  assert.equal(monthlyPayment(12000000,12000000,12,10),0);
  for(const args of [[0,0,12,10],[100,-1,12,10],[100,101,12,10],[100,0,-1,10],[100,0,12,0],[Infinity,0,12,10]])assert.equal(monthlyPayment(...args),null);
});
