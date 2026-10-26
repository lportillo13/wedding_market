import assert from 'node:assert/strict';
import test from 'node:test';
import {processDeletion,type DeletionJob} from '../features/accounts/server/deletion-workflow';

const job:DeletionJob={id:'request',user_id:'client',contact_email:'fixture@example.invalid',language:'en',status:'pending'};
function dependencies(calls:string[]) {
  return {purge:async()=>{calls.push('purge');},cleanMedia:async()=>{calls.push('media');return true;},deleteAuth:async()=>{calls.push('auth');},confirmByEmail:async()=>{calls.push('email');return true;},finish:async()=>{calls.push('finish');}};
}
test('deletion never completes or sends confirmation while media or final review remains',async()=>{
  const calls:string[]=[];const deps=dependencies(calls);
  deps.cleanMedia=async()=>false;
  assert.equal(await processDeletion(job,'admin',true,deps),'media-pending');assert.deepEqual(calls,['purge']);
  calls.length=0;assert.equal(await processDeletion(job,'admin',false,dependencies(calls)),'review-required');
  assert.deepEqual(calls,['purge','media','auth']);
});
test('provider failures leave completion retryable and only successful confirmation finalizes',async()=>{
  const calls:string[]=[];const deps=dependencies(calls);deps.confirmByEmail=async()=>false;
  assert.equal(await processDeletion(job,'admin',true,deps),'email-pending');assert.ok(!calls.includes('finish'));
  calls.length=0;assert.equal(await processDeletion(job,'admin',true,dependencies(calls)),'completed');
  assert.deepEqual(calls,['purge','media','auth','email','finish']);
});
test('self-processing is rejected and completed requests perform no further provider work',async()=>{
  const calls:string[]=[];
  await assert.rejects(processDeletion(job,'client',true,dependencies(calls)),/Another/);
  assert.equal(await processDeletion({...job,status:'completed',user_id:null},'admin',true,dependencies(calls)),'completed');
  assert.deepEqual(calls,[]);
});
