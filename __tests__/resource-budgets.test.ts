import assert from 'node:assert/strict';
import test from 'node:test';
import { PublicJsonCache } from '../lib/resources/public-json-cache';
import { RefreshGate, INBOX_LIST_REFRESH_MS, INBOX_THREAD_REFRESH_MS } from '../shared/resources/refresh-gate';

test('public cache coalesces requests, returns copies, expires, and never caches failures', async () => {
  let now=0, calls=0;
  const cache=new PublicJsonCache<{items:number[]}>({ttlMs:30,maxEntries:2,maxBytes:200,maxPending:2,now:()=>now});
  const load=async()=>{calls++;return {items:[1]};};
  const readers=await Promise.all(Array.from({length:20},()=>cache.get('same',load)));
  assert.equal(calls,1);readers[0].items.push(2);assert.deepEqual(readers[1].items,[1]);
  assert.deepEqual(await cache.get('same',load),{items:[1]});assert.equal(calls,1);
  now=30;await cache.get('same',load);assert.equal(calls,2);
  for (let i=0;i<2;i++) await assert.rejects(cache.get('error',async()=>{throw Error('offline');}),/offline/);
  await cache.get('error',load);assert.equal(calls,3);
});

test('entry, byte and in-flight budgets stay bounded; invalidation retires old work',async()=>{
  const cache=new PublicJsonCache<string>({ttlMs:100,maxEntries:2,maxBytes:32,maxPending:1});
  let calls=0;const load=async()=>String(++calls);
  await cache.get('a',load);await cache.get('b',load);await cache.get('a',load);await cache.get('c',load);
  await cache.get('b',load);assert.equal(calls,4); // least recently used b was evicted
  await cache.get('large',async()=> 'x'.repeat(20));await cache.get('large',load);assert.equal(calls,5);
  cache.clear();
  let resolve!: (value:string)=>void;
  const old=cache.get('old',()=>new Promise<string>(done=>{resolve=done;}));
  await Promise.resolve();cache.clear();
  await assert.rejects(cache.get('other',load),/busy/); // clear cannot bypass active-load admission
  resolve('obsolete');await old;
  assert.equal(await cache.get('old',load),'6'); // late completion never repopulates the new generation
});

test('refresh wakeups coalesce and concurrent work cannot overlap',()=>{
  const gate=new RefreshGate();
  assert.equal(gate.begin(0),true);assert.equal(gate.begin(10_000),false);
  gate.finish();assert.equal(gate.begin(1_000),false);assert.equal(gate.begin(5_000),true);
  assert.equal(INBOX_LIST_REFRESH_MS,60_000);assert.equal(INBOX_THREAD_REFRESH_MS,30_000);
});
