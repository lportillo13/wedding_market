import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMessagePush,matchesMessagePush,notificationThreadTarget,NoticeDeduplication} from '../shared/notifications/push';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const input={notificationId:id(1),recipientId:id(2),type:'thread_reply',data:{messagePreview:'PRIVATE BODY',senderName:'PRIVATE NAME',amountCents:123456}};
const binding={token:'ExponentPushToken[device]',bindingId:id(3),language:'en'};
test('phone alerts contain only generic copy and opaque IDs in both languages',()=>{
 for(const language of ['en','es'])for(const type of ['thread_reply','quote_answered','vendor_new_request','vendor_quote_accepted']){
  const message=buildMessagePush({...input,type},{...binding,language});assert.ok(message);
  const serialized=JSON.stringify(message);assert.ok(!serialized.includes('PRIVATE'));assert.ok(!serialized.includes('123456'));assert.ok(!serialized.includes('messagePreview'));
  assert.equal(message.channelId,'wm-messages-quotes');
 }
 assert.equal(buildMessagePush({...input,type:'unknown'},binding),null);
});
test('stale account/binding/expired and untrusted push payloads cannot present or open a conversation',()=>{
 const message=buildMessagePush(input,binding)!;const scope={recipientId:id(2),bindingId:id(3),expiresAt:'2030-01-01T00:00:00Z'};
 assert.equal(matchesMessagePush(message.data,scope,1),true);
 assert.equal(matchesMessagePush(message.data,{...scope,recipientId:id(4)},1),false);
 assert.equal(matchesMessagePush(message.data,{...scope,bindingId:id(5)},1),false);
 assert.equal(matchesMessagePush(message.data,{...scope,expiresAt:'invalid'},1),false);
 assert.equal(matchesMessagePush({...message.data,source:'another-app'},scope,1),false);
 assert.equal(matchesMessagePush({...message.data,notificationId:'https://untrusted.invalid'},scope,1),false);
});
test('owned notifications route per vendor and viewer; duplicate memory stays bounded',()=>{
 const notification={id:id(1),type:'quote_answered',data:{rfqId:id(6),vendorId:id(7),url:'https://untrusted.invalid'}};
 assert.deepEqual(notificationThreadTarget(notification,'client'),{notificationId:id(1),rfqId:id(6),vendorId:id(7)});
 assert.equal(notificationThreadTarget(notification,'vendor'),null);assert.equal(notificationThreadTarget(notification,'guest'),null);
 const seen=new NoticeDeduplication();assert.equal(seen.add('one'),true);assert.equal(seen.add('one'),false);
 for(let n=0;n<100;n++)seen.add(String(n));assert.equal(seen.add('one'),true);seen.clear();assert.equal(seen.add('one'),true);
});
