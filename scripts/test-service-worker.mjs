import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';

test('PWA stores only fixed public assets, removes old private caches, and keeps navigation network-only',async()=>{
  const handlers={},stored=[],deleted=[],matches=[];
  const cache={addAll:async requests=>stored.push(...requests)};
  const caches={open:async()=>cache,keys:async()=>['wm-pwa-v1-static','other-app-cache'],delete:async key=>{deleted.push(key);},match:async(path,options)=>{matches.push({path,options});return new Response('Neutral offline screen');}};
  const self={location:{origin:'https://thewedmarket.com'},addEventListener:(name,handler)=>{handlers[name]=handler;},skipWaiting:async()=>{},clients:{claim:async()=>{}}};
  let online=true;
  class PublicRequest {constructor(path,options){this.path=path;Object.assign(this,options);}}
  vm.runInNewContext(await fs.readFile(new URL('../public/sw.js',import.meta.url),'utf8'),{self,caches,URL,Request:PublicRequest,Response,fetch:async()=>{if(!online)throw Error('offline');return new Response('Personalized page');}});
  let work;handlers.install({waitUntil:value=>{work=value;}});await work;
  assert.deepEqual(stored.map(item=>item.path),['/offline.html','/icon.svg']);assert.ok(stored.every(item=>item.credentials==='omit'));
  handlers.activate({waitUntil:value=>{work=value;}});await work;assert.deepEqual(deleted,['wm-pwa-v1-static']);
  const request=(path,mode='navigate')=>({method:'GET',url:'https://thewedmarket.com'+path,mode});
  let response;
  handlers.fetch({request:request('/account/inbox'),respondWith:value=>{response=value;}});assert.equal(await (await response).text(),'Personalized page');assert.equal(matches.length,0);
  online=false;handlers.fetch({request:request('/account/inbox'),respondWith:value=>{response=value;}});assert.equal(await (await response).text(),'Neutral offline screen');assert.equal(matches[0].path,'/offline.html');
  let intercepted=false;
  for(const path of ['/_next/static/chunk.js','/api/vendors','/account/inbox?_rsc=private']) handlers.fetch({request:request(path,'cors'),respondWith:()=>{intercepted=true;}});
  assert.equal(intercepted,false);assert.equal(stored.length,2);
});
