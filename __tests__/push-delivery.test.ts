import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverMessagePush,type DeliveryBinding} from '../features/notifications/server/delivery';
import {readBoundedJson} from '../shared/resources/read-json';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const notice={recipientId:id(1),notificationId:id(2),type:'thread_reply'};
const bindings:DeliveryBinding[]=Array.from({length:12},(_,n)=>({token:`ExpoPushToken[device_token_${n}]`,binding_id:id(n+10),language:n===0?'es':'en'}));
test('delivery sends one bounded packet, strips private data and retires only rejected bindings',async()=>{
 let sends=0;const retired:DeliveryBinding[]=[];
 const result=await deliverMessagePush({...notice}, {
  bindings:async()=>[bindings[0],bindings[0],{...bindings[0],token:'invalid'},...bindings.slice(1)],
  send:async messages=>{sends++;assert.equal(messages.length,10);assert.equal(messages[0].title,'Nuevo mensaje');assert.deepEqual(Object.keys(messages[0].data).sort(),['bindingId','notificationId','recipientId','source','type','version']);return {status:200,body:{data:messages.map((_,n)=>n===1?{status:'error',details:{error:'DeviceNotRegistered'}}:{status:'ok',id:String(n)})}};},
  retire:async(recipient,binding)=>{assert.equal(recipient,notice.recipientId);retired.push(binding);},
 });
 assert.equal(sends,1);assert.deepEqual(result,{outcome:'failed',attempted:10,accepted:9,retired:1});assert.equal(retired[0].binding_id,bindings[1].binding_id);
});
test('network, malformed-ticket and provider failures settle without retries or retiring valid devices',async()=>{
 for(const mode of ['network','http','malformed']){
  let sends=0;let retired=0;
  const result=await deliverMessagePush(notice,{bindings:async()=>bindings.slice(0,1),send:async()=>{sends++;if(mode==='network')throw Error('offline');return {status:mode==='http'?503:200,body:{data:'invalid'}};},retire:async()=>{retired++;}});
  assert.equal(result.outcome,'failed');assert.equal(sends,1);assert.equal(retired,0);
 }
 const result=await deliverMessagePush(notice,{bindings:async()=>[],send:async()=>{throw Error('must not send');},retire:async()=>{throw Error('must not retire');}});
 assert.equal(result.outcome,'none');assert.equal(result.attempted,0);
});
test('JSON bounds apply to actual bytes and unfinished valid prefixes',async()=>{
 const body=(value:string)=>new Response(value);
 assert.deepEqual(await readBoundedJson(body('{"ok":true}')),{ok:true});
 await assert.rejects(readBoundedJson(body('{"message":"too long"}'),8),/too large/);
 let cancelled=false;
 const stream=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new TextEncoder().encode('{"ok":true}'));},cancel(){cancelled=true;}});
 await assert.rejects(readBoundedJson({body:stream},100,15),/Incomplete/);assert.equal(cancelled,true);
});
