import assert from 'node:assert/strict';
import test from 'node:test';
import { createLocalSchema } from './database/local-schema.mjs';
import { readFile } from 'node:fs/promises';
const id=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('boutique privacy, catalog and appointment transactions',async t=>{
 const {db}=await createLocalSchema();t.after(()=>db.close());
 await db.exec(`INSERT INTO languages(code,name) VALUES('en','English'),('es','Español') ON CONFLICT DO NOTHING;
 INSERT INTO auth.users(id) SELECT ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,5)n;
 INSERT INTO profiles(id,role,full_name,community_terms_version,community_terms_accepted_at) VALUES
 ('${id(1)}','user','Client A','2026-10-26',now()),('${id(2)}','user','Client B','2026-10-26',now()),
 ('${id(3)}','vendor','Store A','2026-10-26',now()),('${id(4)}','vendor','Store B','2026-10-26',now()),('${id(5)}','user','Stranger','2026-10-26',now()) ON CONFLICT(id) DO UPDATE SET role=excluded.role,community_terms_version=excluded.community_terms_version;
 INSERT INTO vendors(id,owner_id,slug,business_name,is_published,gallery_images) VALUES
 ('${id(11)}','${id(3)}','boutique-a','Boutique A',true,'[{"url":"https://example.com/dress.jpg","type":"image"}]'),
 ('${id(12)}','${id(4)}','boutique-b','Boutique B',true,'[{"url":"https://example.com/suit.jpg","type":"image"}]');
 UPDATE site_settings SET value='true'::jsonb WHERE key='community_rules_enforced';`);
 async function as(user,sql,params=[]){await db.exec('BEGIN');try{await db.exec(`SET LOCAL ROLE ${user?'authenticated':'anon'}`);await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)",[user?id(user):'',user?'authenticated':'anon']);const r=await db.query(sql,params);await db.exec('COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
 const rpc=async(user,name,args)=>{const values=Object.values(args);const call=Object.keys(args).map((key,i)=>`${key}=>$${i+1}`).join(',');return (await as(user,`SELECT public.${name}(${call}) AS value`,values)).rows[0].value;};
 const settings={enabled:true,duration_minutes:60,companions_max:2,visit_fee_cents:0,currency:'CRC',policies:{en:'Two companions. Cancel if plans change.',es:'Dos acompañantes.'}};
 const garment={kind:'dress',name:{en:'Sample gown',es:'Vestido'},description:{en:'Description',es:'Descripción'},designer:'Studio',reference:'A1',offer:'purchase',details:{silhouette:'A-line'},sample_sizes:'US 12',order_sizes:'US 4–24',lead_time:'Ask store',price_cents:125000,currency:'CRC',media_indexes:[0],is_published:true};
 let itemA,itemB,appointmentA,appointmentB,appointmentOther,version;
 await t.test('only the owner can manage a boutique and its outfits',async()=>{
  await assert.rejects(rpc(1,'save_boutique',{p_vendor:id(11),p_data:settings}),{code:'42501'});
  await rpc(3,'save_boutique',{p_vendor:id(11),p_data:settings});await rpc(4,'save_boutique',{p_vendor:id(12),p_data:settings});
  itemA=await rpc(3,'save_boutique_item',{p_vendor:id(11),p_id:null,p_data:garment});itemB=await rpc(4,'save_boutique_item',{p_vendor:id(12),p_id:null,p_data:{...garment,kind:'suit'}});
  await assert.rejects(rpc(4,'save_boutique_item',{p_vendor:id(12),p_id:itemA,p_data:garment}),{code:'42501'});
 });
 await t.test('media selections cannot inject foreign uploads or publish without a photo',async()=>{
  await assert.rejects(rpc(3,'save_boutique_item',{p_vendor:id(11),p_id:itemA,p_data:{...garment,media_indexes:[99]}}),{code:'22023'});
  await assert.rejects(rpc(3,'save_boutique_item',{p_vendor:id(11),p_id:itemA,p_data:{...garment,media_indexes:[]}}),{code:'22023'});
 });
 await t.test('guest catalog masks prices/contact; client catalog exposes permitted prices',async()=>{
  const guest=await rpc(null,'boutique_storefront',{p_slug:'boutique-a'});assert.equal(guest.items[0].price_cents,null);assert.equal(guest.address,null);assert.equal(guest.items.length,1);
  const client=await rpc(1,'boutique_storefront',{p_slug:'boutique-a'});assert.equal(client.items[0].price_cents,125000);
  const vendor=await rpc(4,'boutique_storefront',{p_slug:'boutique-a'});assert.equal(vendor.items[0].price_cents,null);
  await assert.rejects(as(null,'SELECT * FROM boutique_items'),{code:'42501'});
  assert.equal((await as(4,'SELECT * FROM boutique_items WHERE id=$1',[itemA])).rows.length,0);
 });
 await t.test('favorites persist idempotently and remain private',async()=>{
  await rpc(1,'set_boutique_favorite',{p_item:itemA,p_saved:true});await rpc(1,'set_boutique_favorite',{p_item:itemA,p_saved:true});
  assert.equal((await rpc(1,'boutique_saved_outfits',{})).length,1);assert.equal((await rpc(2,'boutique_saved_outfits',{})).length,0);
  assert.equal((await as(2,'SELECT * FROM boutique_favorites')).rows.length,0);
  await assert.rejects(rpc(null,'set_boutique_favorite',{p_item:itemA,p_saved:true}),{code:'42501'});
 });
 const start=new Date(Date.now()+7*86400000).toISOString();
 const payload=()=>({starts_at:start,wedding_date:'',companions:1,size_note:'US 12',budget:'optional',note:'A private visit',items:[itemA],accepted:true,policies_version:version});
 await t.test('requests snapshot policies and outfits; exact retries never duplicate or overwrite',async()=>{
  version=(await db.query('SELECT updated_at FROM boutiques WHERE vendor_id=$1',[id(11)])).rows[0].updated_at;
  const body=payload();appointmentA=await rpc(1,'request_boutique_appointment',{p_vendor:id(11),p_submission:id(51),p_data:body});
  assert.equal(await rpc(1,'request_boutique_appointment',{p_vendor:id(11),p_submission:id(51),p_data:body}),appointmentA);
  await assert.rejects(rpc(1,'request_boutique_appointment',{p_vendor:id(11),p_submission:id(51),p_data:{...body,note:'Overwrite'}}),{code:'22023'});
  assert.equal((await db.query('SELECT count(*)::int n FROM boutique_appointments')).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM rfqs')).rows[0].n,0);
 });
 await t.test('wrong-store outfits, stale policies, expired times and excess companions fail atomically',async()=>{
  for(const changes of [{items:[itemB]},{policies_version:'2020-01-01T00:00:00Z'},{starts_at:'2020-01-01T00:00:00Z'},{companions:3}])await assert.rejects(rpc(1,'request_boutique_appointment',{p_vendor:id(11),p_submission:id(52),p_data:{...payload(),...changes}}),{code:'22023'});
  assert.equal((await db.query('SELECT count(*)::int n FROM boutique_appointments')).rows[0].n,1);
 });
 await t.test('appointment privacy and decision ownership are enforced in PostgreSQL',async()=>{
  assert.equal((await rpc(5,'boutique_appointment_inbox',{})).length,0);assert.equal((await as(4,'SELECT * FROM boutique_appointments')).rows.length,0);
  await assert.rejects(rpc(1,'decide_boutique_appointment',{p_id:appointmentA,p_status:'confirmed',p_version:1}),{code:'42501'});
  await assert.rejects(rpc(4,'decide_boutique_appointment',{p_id:appointmentA,p_status:'confirmed',p_version:1}),{code:'42501'});
  await assert.rejects(as(1,"UPDATE boutique_appointments SET status='confirmed'"),{code:'42501'});
 });
 await t.test('only store-confirmed visits reserve time; overlapping confirmations are rejected',async()=>{
  appointmentB=await rpc(2,'request_boutique_appointment',{p_vendor:id(11),p_submission:id(53),p_data:{...payload(),starts_at:new Date(new Date(start).getTime()+30*60000).toISOString()}});
  await rpc(3,'decide_boutique_appointment',{p_id:appointmentA,p_status:'confirmed',p_version:1});
  await rpc(3,'decide_boutique_appointment',{p_id:appointmentA,p_status:'confirmed',p_version:1});
  await assert.rejects(rpc(3,'decide_boutique_appointment',{p_id:appointmentB,p_status:'confirmed',p_version:1}),{code:'22023'});
  assert.equal((await db.query('SELECT status FROM boutique_appointments WHERE id=$1',[appointmentB])).rows[0].status,'requested');
  const v2=(await db.query('SELECT updated_at FROM boutiques WHERE vendor_id=$1',[id(12)])).rows[0].updated_at;
  appointmentOther=await rpc(1,'request_boutique_appointment',{p_vendor:id(12),p_submission:id(54),p_data:{...payload(),items:[itemB],policies_version:v2}});
  await rpc(4,'decide_boutique_appointment',{p_id:appointmentOther,p_status:'confirmed',p_version:1});
  assert.equal((await db.query("SELECT count(*)::int n FROM boutique_appointments WHERE status='confirmed'")).rows[0].n,2);
 });
 await t.test('private messages are retry-safe and do not leak between stores or clients',async()=>{
  await rpc(1,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(61),p_body:'Please confirm the sample size.'});
  await rpc(1,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(61),p_body:'Please confirm the sample size.'});
  await assert.rejects(rpc(1,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(61),p_body:'Replacement'}),{code:'22023'});
  await rpc(3,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(62),p_body:'We will prepare the sample.'});
  assert.equal((await rpc(1,'boutique_appointment_inbox',{p_id:appointmentA}))[0].messages.length,2);
  assert.equal((await as(2,'SELECT * FROM boutique_appointment_messages')).rows.length,0);
  await assert.rejects(rpc(4,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(63),p_body:'Foreign message'}),{code:'42501'});
 });
 await t.test('blocks stop new requests and replies in both directions; cancellation stays possible',async()=>{
  await db.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)',[id(3),id(1)]);
  await assert.rejects(rpc(1,'request_boutique_appointment',{p_vendor:id(11),p_submission:id(55),p_data:payload()}),{code:'42501'});
  await assert.rejects(rpc(1,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(64),p_body:'Blocked'}),{code:'42501'});
  await assert.rejects(rpc(3,'reply_boutique_appointment',{p_id:appointmentA,p_submission:id(65),p_body:'Blocked'}),{code:'42501'});
  await assert.rejects(rpc(1,'decide_boutique_appointment',{p_id:appointmentA,p_status:'cancelled',p_version:1}),{code:'40001'});
  await rpc(1,'decide_boutique_appointment',{p_id:appointmentA,p_status:'cancelled',p_version:2});
  assert.equal((await db.query('SELECT status FROM boutique_appointments WHERE id=$1',[appointmentOther])).rows[0].status,'confirmed');
 });
 await t.test('renaming outfits does not replace an existing request snapshot',async()=>{
  await rpc(3,'save_boutique_item',{p_vendor:id(11),p_id:itemA,p_data:{...garment,name:{en:'Renamed gown',es:'Otro vestido'}}});
  const a=(await rpc(1,'boutique_appointment_inbox',{p_id:appointmentA}))[0];assert.equal(a.items_snapshot[0].name.en,'Sample gown');
 });
 await t.test('unpublished catalogs and suspended accounts are hidden',async()=>{
  await rpc(3,'save_boutique',{p_vendor:id(11),p_data:{...settings,enabled:false}});
  assert.equal(await rpc(null,'boutique_storefront',{p_slug:'boutique-a'}),null);assert.equal((await rpc(1,'boutique_saved_outfits',{})).length,0);
  await db.query('UPDATE profiles SET suspended_at=now() WHERE id=$1',[id(1)]);
  await assert.rejects(rpc(1,'boutique_appointment_inbox',{}),{code:'42501'});
  assert.equal((await as(1,'SELECT * FROM boutique_appointments')).rows.length,0);
 });
 await t.test('the live verification fixture exercises production functions and leaves no records',async()=>{
  const results=await db.exec(await readFile(new URL('../supabase/tests/verify-boutiques-live.sql',import.meta.url),'utf8'));
  const result=results.at(-1).rows[0].boutique_verification;
  assert.equal(result.workflowChecksPassed,true);assert.equal(result.testAccountsRemaining,0);assert.equal(result.testVendorsRemaining,0);assert.equal(result.testAppointmentsRemaining,0);
 });
});
