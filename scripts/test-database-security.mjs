import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';

// Exercises actual PostgreSQL policies and triggers, with synthetic data only.
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
test('live-schema authorization and transaction regressions', async t => {
  const db = new PGlite({ extensions: { pg_trgm } });
  t.after(() => db.close());
  await db.exec(await readFile(new URL('../supabase/tests/schema-baseline.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610190000_live_schema_baseline.sql', import.meta.url), 'utf8'));
  await db.exec(`INSERT INTO languages(code,name) VALUES ('en','English'),('es','Español');
    INSERT INTO auth.users(id) SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,5) n;
    INSERT INTO profiles(id,role) VALUES ('${id(1)}','user'),('${id(2)}','user'),('${id(3)}','vendor'),('${id(4)}','vendor'),('${id(5)}','admin');
    INSERT INTO vendors(id,owner_id,slug,business_name,is_published) VALUES ('${id(11)}','${id(3)}','published','Published',true),('${id(12)}','${id(4)}','draft','Draft',false);
    INSERT INTO rfqs(id,owner_id) VALUES ('${id(21)}','${id(1)}'),('${id(22)}','${id(2)}'),('${id(23)}','${id(1)}');
    INSERT INTO rfq_invites(rfq_id,vendor_id,expires_at) VALUES ('${id(21)}','${id(11)}',now()+interval '1 day'),('${id(22)}','${id(12)}',now()+interval '1 day');
    INSERT INTO quotes(id,rfq_id,vendor_id,amount_cents,message) VALUES ('${id(31)}','${id(21)}','${id(11)}',10000,'Private quote');`);
  const as = async (role, user, sql, params = [], aal = user===5 ? 'aal2' : 'aal1') => {
    await db.exec('BEGIN');
    try {
      await db.exec(`SET LOCAL ROLE ${role}`);
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true)", [user ? id(user) : '', role]);
      await db.query("SELECT set_config('request.jwt.claim.aal',$1,true)",[aal]);
      const result = await db.query(sql, params);
      await db.exec('COMMIT');
      return result;
    } catch (e) { await db.exec('ROLLBACK'); throw e; }
  };
  await t.test('baseline reproduces anonymous data writes and self-admin escalation', async () => {
    await as('anon', null, "INSERT INTO amenity_lookup(key,group_key) VALUES ('baseline','test')");
    await as('authenticated', 2, "UPDATE profiles SET role='admin' WHERE id=$1", [id(2)]);
    await db.query("UPDATE profiles SET role='user' WHERE id=$1", [id(2)]);
  });
  await db.exec(await readFile(new URL('../supabase/migrations/202610190001_security_hardening.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610190002_atomic_workflows.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610190003_scoped_query_summaries.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610190004_contact_privacy.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610190005_admin_mfa.sql', import.meta.url), 'utf8'));
  await db.exec(await readFile(new URL('../supabase/migrations/202610190006_inquiry_conversations.sql', import.meta.url), 'utf8'));
  // Legacy group data exists before migration 007; this verifies preservation
  // and the narrow reopening of system-generated closures.
  await db.exec(`INSERT INTO auth.users(id) VALUES ('${id(90)}');
    INSERT INTO profiles(id,role) VALUES ('${id(90)}','user') ON CONFLICT(id) DO UPDATE SET role='user';
    INSERT INTO rfqs(id,owner_id) VALUES ('${id(92)}','${id(90)}'),('${id(93)}','${id(90)}');
    INSERT INTO rfq_invites(rfq_id,vendor_id,status,closed_at,closed_reason,expires_at) VALUES
      ('${id(92)}','${id(11)}','accepted',null,null,now()+interval '1 day'),
      ('${id(92)}','${id(12)}','declined',now(),'accepted_other_vendor',now()+interval '1 day'),
      ('${id(93)}','${id(12)}','declined',now(),'archived_by_client',now()+interval '1 day');
    INSERT INTO quotes(id,rfq_id,vendor_id) VALUES ('${id(95)}','${id(92)}','${id(11)}');
    UPDATE rfqs SET accepted_quote_id='${id(95)}',accepted_at=now() WHERE id='${id(92)}';`);
  await db.exec(await readFile(new URL('../supabase/migrations/202610200007_independent_vendor_bookings.sql', import.meta.url), 'utf8'));
  const deny = async (role, user, sql, params) => assert.rejects(as(role, user, sql, params), { code: '42501' });
  await t.test('anonymous cannot mutate any formerly unprotected table', async () => {
    for (const table of ['amenity_lookup','languages','vendor_amenities','vendor_pricing','vendor_spaces','vendor_team']) {
      await deny('anon', null, `DELETE FROM ${table}`);
    }
  });
  await t.test('self-admin, other profiles, and schema creation are blocked', async () => {
    await deny('authenticated', 1, "UPDATE profiles SET role='admin' WHERE id=$1", [id(1)]);
    assert.equal((await as('authenticated', 1, 'SELECT * FROM profiles WHERE id=$1', [id(2)])).rows.length, 0);
    await deny('authenticated', 1, 'CREATE TABLE public.attacker_table(id int)');
    await deny('anon',null,'TRUNCATE public.vendors CASCADE');
    await deny('authenticated',1,'TRUNCATE public.rfqs CASCADE');
    await as('authenticated', 1, "UPDATE profiles SET full_name='A',role='vendor' WHERE id=$1", [id(1)]);
    await as('authenticated', 1, "UPDATE profiles SET role='user' WHERE id=$1", [id(1)]);
  });
  await t.test('Auth provisioning ignores administrative metadata and invalid optional numbers', async () => {
    await db.query('INSERT INTO auth.users(id,raw_user_meta_data) VALUES ($1,$2)', [id(6), { role: 'admin', full_name: 'New', guest_count: 'bad', wedding_budget: 'bad', language: 'es' }]);
    const row=(await db.query('SELECT * FROM profiles WHERE id=$1',[id(6)])).rows[0];
    assert.equal(row.role, 'user'); assert.equal(row.language, 'es'); assert.equal(row.guest_count, null);
  });
  await t.test('private views honor row ownership and published views hide drafts', async () => {
    await deny('anon', null, 'SELECT * FROM vendor_latest_quotes');
    assert.equal((await as('authenticated', 2, 'SELECT * FROM vendor_latest_quotes')).rows.length, 0);
    assert.equal((await as('authenticated', 1, 'SELECT * FROM vendor_latest_quotes')).rows.length, 1);
    assert.equal((await as('anon', null, 'SELECT * FROM vendors')).rows.length, 1);
    assert.equal((await as('anon', null, 'SELECT * FROM vendor_public_search')).rows.length, 1);
    assert.equal((await as('authenticated', 4, 'SELECT * FROM vendors WHERE id=$1', [id(12)])).rows.length, 1);
  });
  await t.test('child data can only be changed by its owner or admin', async () => {
    await as('authenticated', 3, 'INSERT INTO vendor_spaces(vendor_id,name) VALUES ($1,$2)', [id(11), { en:'Hall' }]);
    await deny('authenticated', 4, 'INSERT INTO vendor_spaces(vendor_id,name) VALUES ($1,$2)', [id(11), { en:'Hijack' }]);
    await deny('authenticated', 3, 'UPDATE vendors SET rating_avg=5,rating_count=999 WHERE id=$1', [id(11)]);
    await as('authenticated', 5, "INSERT INTO amenity_lookup(key,group_key) VALUES ('admin','test')");
    await deny('authenticated', 1, "INSERT INTO amenity_lookup(key,group_key) VALUES ('client','test')");
  });
  await t.test('invited proposals receive atomic versions and cannot be overwritten', async () => {
    const row=(await as('authenticated', 3, 'INSERT INTO quotes(rfq_id,vendor_id,version) VALUES ($1,$2,999) RETURNING version', [id(21),id(11)])).rows[0];
    assert.equal(row.version,2);
    await deny('authenticated', 3, 'INSERT INTO quotes(rfq_id,vendor_id) VALUES ($1,$2)', [id(23),id(11)]);
    await deny('authenticated', 4, 'INSERT INTO quotes(rfq_id,vendor_id) VALUES ($1,$2)', [id(21),id(11)]);
    await deny('authenticated', 3, 'UPDATE quotes SET amount_cents=1 WHERE id=$1', [id(31)]);
    await deny('authenticated', 3, 'DELETE FROM quotes WHERE id=$1', [id(31)]);
    await deny('authenticated', 3, 'UPDATE rfq_invites SET reveal_email=true WHERE rfq_id=$1', [id(21)]);
    await as('authenticated',1,"UPDATE rfq_invites SET closed_at=now(),closed_reason='archived_by_client' WHERE rfq_id=$1",[id(21)]);
    await deny('authenticated',3,'UPDATE rfq_invites SET closed_at=null,closed_reason=null WHERE rfq_id=$1',[id(21)]);
    await deny('authenticated',3,'INSERT INTO quotes(rfq_id,vendor_id) VALUES ($1,$2)',[id(21),id(11)]);
    await as('authenticated',1,'UPDATE rfq_invites SET closed_at=null,closed_reason=null WHERE rfq_id=$1',[id(21)]);
  });
  await t.test('reviews require the correct accepted booking, force real dates, and update ratings', async () => {
    await deny('authenticated', 1, 'INSERT INTO reviews(rfq_id,vendor_id,author_id,stars) VALUES ($1,$2,$3,5)', [id(21),id(11),id(1)]);
    await as('authenticated',1,'SELECT accept_vendor_quote($1,(SELECT id FROM quotes WHERE rfq_id=$1 ORDER BY version DESC LIMIT 1),false,false)',[id(21)]);
    await deny('authenticated', 2, 'INSERT INTO reviews(rfq_id,vendor_id,author_id,stars) VALUES ($1,$2,$3,5)', [id(21),id(11),id(2)]);
    await as('authenticated',1,"INSERT INTO reviews(rfq_id,vendor_id,author_id,stars,created_at) VALUES ($1,$2,$3,4,now()+interval '1 year')",[id(21),id(11),id(1)]);
    assert.equal((await db.query('SELECT rating_count FROM vendors WHERE id=$1',[id(11)])).rows[0].rating_count,1);
    await deny('authenticated',1,'UPDATE reviews SET vendor_id=$1 WHERE author_id=$2',[id(12),id(1)]);
    await db.query("UPDATE reviews SET created_at=now()-interval '8 days' WHERE author_id=$1",[id(1)]);
    assert.equal((await as('authenticated',1,'UPDATE reviews SET stars=1 WHERE author_id=$1 RETURNING id',[id(1)])).rows.length,0);
  });
  await t.test('notification injection is blocked but member notification/read flows work',async()=>{
    const data={rfqId:id(21),vendorId:id(11),quoteId:id(31)};
    await deny('authenticated',2,"INSERT INTO notifications(recipient_id,actor_id,type,title,data) VALUES ($1,$2,'quote_answered','Spam',$3)",[id(1),id(2),data]);
    const n={id:id(41)};
    await as('authenticated',3,"INSERT INTO notifications(id,recipient_id,actor_id,type,title,data) VALUES ($4,$1,$2,'quote_answered','Quote',$3)",[id(1),id(3),data,n.id]);
    await as('authenticated',1,'UPDATE notifications SET read_at=now() WHERE id=$1',[n.id]);
    await deny('authenticated',1,"UPDATE notifications SET title='spoof' WHERE id=$1",[n.id]);
  });
  await t.test('failed section replacement rolls back rows and settings; other owners cannot replace',async()=>{
    const save=(role,user,section,rows,settings={})=>as(role,user,'SELECT replace_vendor_section($1,$2,$3,$4)',[id(11),section,JSON.stringify(rows),JSON.stringify(settings)]);
    await save('authenticated',3,'pricing',[{item_key:'package',price_cents:20000}],{pricing_typical_spend_cents:30000});
    await assert.rejects(save('authenticated',3,'pricing',[{item_key:null}],{pricing_typical_spend_cents:1}));
    assert.equal((await db.query('SELECT price_cents FROM vendor_pricing WHERE vendor_id=$1',[id(11)])).rows[0].price_cents,20000);
    assert.equal((await db.query('SELECT pricing_typical_spend_cents FROM vendors WHERE id=$1',[id(11)])).rows[0].pricing_typical_spend_cents,30000);
    await assert.rejects(save('authenticated',4,'pricing',[]),/ownership/);
    await save('authenticated',3,'availability',[{available_on:'2027-01-01',availability_status:'busy'}]);
    await assert.rejects(save('authenticated',3,'availability',[{available_on:'2027-01-01'},{available_on:'2027-01-01'}]));
    assert.equal((await db.query('SELECT availability_status FROM vendor_availability WHERE vendor_id=$1',[id(11)])).rows[0].availability_status,'busy');
  });
  await t.test('team replacement preserves both languages when a row fails validation',async()=>{
    const save=rows=>as('authenticated',3,'SELECT replace_vendor_section($1,$2,$3,$4)',[id(11),'team',JSON.stringify(rows),'{}']);
    await save([{name:'Camila',title:{en:'Photographer',es:'Fotógrafa'},bio:{en:'Eight years',es:'Ocho años'},responds_within_hours:24,sort_order:0}]);
    await assert.rejects(save([{name:'Invalid',responds_within_hours:'invalid'}]));
    const row=(await db.query('SELECT name,title,bio FROM vendor_team WHERE vendor_id=$1',[id(11)])).rows[0];
    assert.equal(row.name,'Camila');
    assert.equal(row.title.es,'Fotógrafa');
    assert.equal(row.bio.en,'Eight years');
  });
  await t.test('failed service selection preserves existing options and capacity',async()=>{
    await db.exec("INSERT INTO amenity_lookup(key,group_key) VALUES ('profile-regression','services')");
    const save=(rows,capacity)=>as('authenticated',3,'SELECT replace_vendor_section($1,$2,$3,$4)',[id(11),'amenities',JSON.stringify(rows),JSON.stringify({capacity_max:capacity,event_types:[]})]);
    await save([{amenity_key:'profile-regression'}],120);
    await assert.rejects(save([{amenity_key:'missing-profile-option'}],999));
    assert.equal((await db.query('SELECT amenity_key FROM vendor_amenities WHERE vendor_id=$1',[id(11)])).rows[0].amenity_key,'profile-regression');
    assert.equal((await db.query('SELECT capacity_max FROM vendors WHERE id=$1',[id(11)])).rows[0].capacity_max,120);
  });
  await t.test('acceptance verifies ownership, leaves other invitations open, and is idempotent',async()=>{
    await db.exec(`INSERT INTO rfq_invites(rfq_id,vendor_id,expires_at) VALUES ('${id(23)}','${id(11)}',now()+interval '1 day'),('${id(23)}','${id(12)}',now()+interval '1 day');
      INSERT INTO quotes(id,rfq_id,vendor_id) VALUES ('${id(33)}','${id(23)}','${id(11)}');`);
    await deny('authenticated',2,'SELECT accept_vendor_quote($1,$2,false,false)',[id(23),id(33)]);
    await deny('authenticated',1,'UPDATE rfqs SET accepted_quote_id=$1 WHERE id=$2',[id(31),id(23)]);
    await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,true,false)',[id(23),id(33)]);
    assert.equal((await db.query('SELECT status FROM rfq_invites WHERE rfq_id=$1 AND vendor_id=$2',[id(23),id(12)])).rows[0].status,'invited');
    assert.equal((await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,true,false) AS result',[id(23),id(33)])).rows[0].result.alreadyAccepted,true);
    await deny('authenticated',1,'UPDATE rfq_invites SET accepted_quote_id=null,accepted_at=null WHERE rfq_id=$1 AND vendor_id=$2',[id(23),id(11)]);
    await as('authenticated',3,"INSERT INTO quote_messages(quote_id,sender_id,sender_role,body) VALUES ($1,$2,'vendor','Accepted follow-up')",[id(33),id(3)]);
    await as('authenticated',3,"UPDATE rfq_invites SET closed_at=now(),closed_reason='archived_by_vendor' WHERE rfq_id=$1 AND vendor_id=$2",[id(23),id(11)]);
    await deny('authenticated',3,"INSERT INTO quote_messages(quote_id,sender_id,sender_role,body) VALUES ($1,$2,'vendor','Closed message')",[id(33),id(3)]);
  });
  await t.test('vendor RFQ reads mask email and phone until consent; base rows cannot bypass the projection',async()=>{
    await db.query("UPDATE rfqs SET contact_email='couple@example.test',guest_lead_email='couple@example.test',contact_phone='+15550123456',guest_phone='+15550123456' WHERE id=$1",[id(21)]);
    assert.equal((await as('authenticated',3,'SELECT id FROM rfqs WHERE id=$1',[id(21)])).rows.length,0);
    let row=(await as('authenticated',3,'SELECT * FROM rfqs_visible WHERE id=$1',[id(21)])).rows[0];
    assert.equal(row.contact_email,null); assert.equal(row.guest_lead_email,null); assert.equal(row.contact_phone,null);
    await as('authenticated',1,'UPDATE rfq_invites SET reveal_email=true WHERE rfq_id=$1 AND vendor_id=$2',[id(21),id(11)]);
    row=(await as('authenticated',3,'SELECT * FROM rfqs_visible WHERE id=$1',[id(21)])).rows[0];
    assert.equal(row.contact_email,'couple@example.test');assert.equal(row.contact_phone,null);
    assert.equal((await as('authenticated',4,'SELECT id FROM rfqs_visible WHERE id=$1',[id(21)])).rows.length,0);
    await deny('anon',null,'SELECT * FROM rfqs_visible');
  });
  await t.test('inbox summaries paginate all owned threads without loading message bodies or exposing other users',async()=>{
    await db.exec(`INSERT INTO rfqs(id,owner_id,notes) SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'${id(1)}',repeat('a',5000) FROM generate_series(100,159) n;
      INSERT INTO rfq_invites(rfq_id,vendor_id) SELECT id,'${id(11)}' FROM rfqs WHERE notes=repeat('a',5000);`);
    const first=(await as('authenticated',1,"SELECT * FROM list_inbox_threads('client',1,false,'',null)")).rows;
    assert.equal(first.length,50);assert.equal(first[0].total_count,63);assert.ok(first.every(x=>x.rfq.notes===null || x.rfq.notes.length<=240));
    const second=(await as('authenticated',1,"SELECT * FROM list_inbox_threads('client',2,false,'',null)")).rows;
    assert.equal(second.length,13);
    assert.equal((await as('authenticated',2,"SELECT * FROM list_inbox_threads('client',1,false,'',null)")).rows.length,1);
    assert.equal((await as('authenticated',2,"SELECT * FROM list_inbox_threads('vendor',1,false,'',null)")).rows.length,0);
    await deny('anon',null,"SELECT * FROM list_inbox_threads('client',1,false,'',null)");
  });
  await t.test('public directory excludes drafts and returns only bounded card fields',async()=>{
    await db.query('UPDATE vendors SET bio=$1,gallery_images=$2 WHERE id=$3',[{en:'Published '+ 'x'.repeat(5000)},[{url:'https://example.test/large-gallery'}],id(11)]);
    const result=(await as('anon',null,"SELECT search_vendor_directory('','',1,999) AS data")).rows[0].data;
    assert.equal(result.total,1);assert.equal(result.items[0].bio_en.length,160);
    assert.equal('gallery_images' in result.items[0],false);assert.equal('extra_info_en' in result.items[0],false);
  });
  await t.test('admin database writes require a verified MFA session',async()=>{
    assert.equal((await as('authenticated',5,'SELECT id FROM profiles WHERE id=$1',[id(5)],'aal1')).rows.length,1);
    assert.equal((await as('authenticated',5,'SELECT id FROM profiles WHERE id=$1',[id(1)],'aal1')).rows.length,0);
    await assert.rejects(as('authenticated',5,"INSERT INTO amenity_lookup(key,group_key) VALUES ('mfa-denied','test')",[],'aal1'),{code:'42501'});
    await as('authenticated',5,"INSERT INTO amenity_lookup(key,group_key) VALUES ('mfa-allowed','test')",[],'aal2');
  });
  await t.test('media limits are atomic and failed appends preserve existing assets',async()=>{
    await db.query("UPDATE vendors SET gallery_images='[]'::jsonb WHERE id=$1",[id(11)]);
    const assets=Array.from({length:20},(_,n)=>({type:'image',url:`https://example.test/${n}`}));
    await as('authenticated',3,'SELECT append_vendor_media($1,$2)',[id(11),JSON.stringify(assets)]);
    await assert.rejects(as('authenticated',3,'SELECT append_vendor_media($1,$2)',[id(11),JSON.stringify([{type:'image'}])]),{code:'22023'});
    assert.equal((await db.query('SELECT jsonb_array_length(gallery_images) AS n FROM vendors WHERE id=$1',[id(11)])).rows[0].n,20);
    await deny('authenticated',4,'SELECT append_vendor_media($1,$2)',[id(11),'[]']);
  });
  await t.test('group inquiry creation is atomic, bounded, scoped and idempotent',async()=>{
    await db.query("INSERT INTO vendors(id,owner_id,slug,business_name,is_published) VALUES ($1,$2,'second-service','Second service',true)",[id(13),id(4)]);
    const payload={notes:'Synthetic garden event',guest_count:60,budget:0,email:'fixture@example.invalid',event_date:'2027-05-12'};
    const create=(vendors,key,body=payload,user=1,existing=null)=>as('authenticated',user,'SELECT create_inquiry($1,$2,$3,$4) AS result',[vendors,JSON.stringify(body),key,existing]);
    await deny('anon',null,'SELECT create_inquiry($1,$2,$3)',[[id(11)],JSON.stringify(payload),id(1100)]);
    const first=(await create([id(11),id(13),id(11)],id(1100))).rows[0].result;
    assert.equal(first.vendor_count,2);
    assert.equal((await db.query('SELECT count(*)::integer n FROM rfq_invites WHERE rfq_id=$1',[id(1100)])).rows[0].n,2);
    const row=(await db.query('SELECT * FROM rfqs WHERE id=$1',[id(1100)])).rows[0];
    assert.equal(row.vendor_id,null); assert.equal(row.country,'Costa Rica'); assert.equal(row.budget_min,0); assert.equal(row.budget_max,0);
    assert.equal((await create([id(13),id(11)],id(1100))).rows[0].result.replayed,true);
    await assert.rejects(create([id(11)],id(1100),{...payload,notes:'Changed retry'}),{code:'23505'});
    await assert.rejects(create([id(11),id(1999)],id(1101)),{code:'22023'});
    assert.equal((await db.query('SELECT count(*)::integer n FROM rfqs WHERE id=$1',[id(1101)])).rows[0].n,0);
    await db.exec(`CREATE FUNCTION public.wm_test_fail_invite() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.vendor_id='${id(13)}' THEN RAISE EXCEPTION 'synthetic invite failure' USING ERRCODE='22023'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER wm_test_fail BEFORE INSERT ON rfq_invites FOR EACH ROW EXECUTE FUNCTION wm_test_fail_invite();`);
    await assert.rejects(create([id(11),id(13)],id(1102)),{code:'22023'});
    assert.equal((await db.query('SELECT count(*)::integer n FROM rfqs WHERE id=$1',[id(1102)])).rows[0].n,0);
    await db.exec('DROP TRIGGER wm_test_fail ON rfq_invites; DROP FUNCTION public.wm_test_fail_invite();');
    await create([id(11)],id(1103));
    await create([id(11)],id(1104),{...payload,notes:'Edited event'},1,id(1103));
    assert.equal((await create([id(11)],id(1104),{...payload,notes:'Edited event'},1,id(1103))).rows[0].result.replayed,true);
    assert.equal((await db.query('SELECT notes FROM rfqs WHERE id=$1',[id(1103)])).rows[0].notes,'Edited event');
  });
  await t.test('messages work before a proposal and stay private to each group vendor',async()=>{
    const send=(user,role,vendor,body,key)=>as('authenticated',user,'INSERT INTO quote_messages(id,rfq_id,vendor_id,sender_id,sender_role,body) VALUES ($1,$2,$3,$4,$5,$6)',[id(key),id(1100),id(vendor),id(user),role,body]);
    await send(1,'client',11,'Synthetic first question',1110);
    await send(3,'vendor',11,'Synthetic vendor answer',1111);
    assert.equal((await db.query('SELECT quote_id FROM quote_messages WHERE id=$1',[id(1110)])).rows[0].quote_id,null);
    await deny('authenticated',4,'INSERT INTO quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES ($1,$2,$3,$4,$5)',[id(1100),id(11),id(4),'vendor','Not my thread']);
    await assert.rejects(send(1,'vendor',11,'Wrong sender role',1112),{code:'42501'});
    assert.equal((await as('authenticated',4,'SELECT * FROM quote_messages WHERE rfq_id=$1 AND vendor_id=$2',[id(1100),id(11)])).rows.length,0);
    assert.equal((await as('authenticated',2,'SELECT * FROM quote_messages WHERE rfq_id=$1',[id(1100)])).rows.length,0);
    const summaries=(await as('authenticated',1,"SELECT * FROM list_inbox_threads('client',1,false,'Synthetic vendor answer',$1)",[id(1100)])).rows;
    assert.equal(summaries.length,1); assert.ok(summaries[0].unread_at);
    await as('authenticated',3,"INSERT INTO notifications(recipient_id,actor_id,type,title,body,data) VALUES ($1,$2,'thread_reply','Reply','Reply',$3)",[id(1),id(3),JSON.stringify({rfqId:id(1100),vendorId:id(11),quoteId:null,senderRole:'vendor'})]);
    await deny('authenticated',4,"INSERT INTO notifications(recipient_id,actor_id,type,title,body,data) VALUES ($1,$2,'thread_reply','Reply','Reply',$3)",[id(1),id(4),JSON.stringify({rfqId:id(1100),vendorId:id(11),quoteId:null,senderRole:'vendor'})]);
    await as('authenticated',1,"UPDATE rfq_invites SET closed_at=now(),closed_reason='archived_by_client' WHERE rfq_id=$1 AND vendor_id=$2",[id(1100),id(11)]);
    await assert.rejects(send(3,'vendor',11,'Closed send',1113),{code:'42501'});
    await as('authenticated',1,"UPDATE rfq_invites SET closed_at=null,closed_reason=null WHERE rfq_id=$1 AND vendor_id=$2",[id(1100),id(11)]);
    await send(3,'vendor',11,'Restored send',1114);
  });
  await t.test('empty folders retain accurate counts and invalid inquiry edits cannot overwrite a conversation',async()=>{
    const rows=(await as('authenticated',1,"SELECT * FROM list_inbox_threads_v2('client',1,true,'',$1)",[id(1100)])).rows;
    assert.equal(rows.length,1);assert.equal(rows[0].invite,null);assert.equal(rows[0].total_count,0);assert.equal(rows[0].active_count,2);
    const request={notes:'Do not overwrite',guest_count:60,email:'fixture@example.invalid'};
    await assert.rejects(as('authenticated',1,'SELECT create_inquiry($1,$2,$3,$4)',[[id(11)],JSON.stringify(request),id(1200),id(1100)]),{code:'23505'});
    assert.equal((await db.query('SELECT notes FROM rfqs WHERE id=$1',[id(1100)])).rows[0].notes,'Synthetic garden event');
  });
  await t.test('proposal revisions retain earlier messages and stale offers cannot be accepted',async()=>{
    await as('authenticated',3,'INSERT INTO quotes(id,rfq_id,vendor_id,amount_cents) VALUES ($1,$2,$3,10000)',[id(1120),id(1103),id(11)]);
    await as('authenticated',1,"INSERT INTO quote_messages(quote_id,sender_id,sender_role,body) VALUES ($1,$2,'client','Legacy reply')",[id(1120),id(1)]);
    await as('authenticated',3,'INSERT INTO quotes(id,rfq_id,vendor_id,amount_cents) VALUES ($1,$2,$3,12500)',[id(1121),id(1103),id(11)]);
    await assert.rejects(as('authenticated',1,'SELECT accept_vendor_quote($1,$2,false,false)',[id(1103),id(1120)]),{code:'22023'});
    await deny('authenticated',1,'UPDATE rfqs SET accepted_quote_id=$1 WHERE id=$2',[id(1120),id(1103)]);
    await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,false,false)',[id(1103),id(1121)]);
    await db.query("UPDATE rfq_invites SET expires_at=now()-interval '1 day' WHERE rfq_id=$1",[id(1103)]);
    await as('authenticated',3,"INSERT INTO quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES ($1,$2,$3,'vendor','Booked follow-up')",[id(1103),id(11),id(3)]);
    const history=(await as('authenticated',1,'SELECT * FROM quote_messages WHERE rfq_id=$1 AND vendor_id=$2 ORDER BY created_at,id',[id(1103),id(11)])).rows;
    assert.equal(history.length,2); assert.equal(history[0].quote_id,id(1120));
    await deny('authenticated',3,'INSERT INTO quotes(rfq_id,vendor_id,amount_cents) VALUES ($1,$2,999)',[id(1103),id(11)]);
    await db.query("UPDATE rfq_invites SET expires_at=now()-interval '1 day' WHERE rfq_id=$1",[id(1100)]);
    await deny('authenticated',1,"INSERT INTO quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES ($1,$2,$3,'client','Expired')",[id(1100),id(11),id(1)]);
  });
  await t.test('migration preserves existing bookings and only reopens legacy automatic closures',async()=>{
    const rows=(await db.query('SELECT * FROM rfq_invites WHERE rfq_id=$1 ORDER BY vendor_id',[id(92)])).rows;
    assert.equal(rows[0].accepted_quote_id,id(95)); assert.ok(rows[0].accepted_at);
    assert.equal(rows[1].accepted_quote_id,null); assert.equal(rows[1].status,'invited'); assert.equal(rows[1].closed_at,null);
    const manual=(await db.query('SELECT * FROM rfq_invites WHERE rfq_id=$1',[id(93)])).rows[0];
    assert.equal(manual.closed_reason,'archived_by_client'); assert.ok(manual.closed_at);
  });
  await t.test('group vendors book independently with private consent, messages, summaries and reviews',async()=>{
    await db.exec(`INSERT INTO rfqs(id,owner_id,contact_email,contact_phone) VALUES ('${id(1300)}','${id(1)}','isolated@example.invalid','+15550000000');
      INSERT INTO rfq_invites(rfq_id,vendor_id,expires_at) VALUES ('${id(1300)}','${id(11)}',now()+interval '1 day'),('${id(1300)}','${id(12)}',now()+interval '1 day');`);
    await as('authenticated',3,'INSERT INTO quotes(id,rfq_id,vendor_id,amount_cents) VALUES ($1,$2,$3,10000)',[id(1301),id(1300),id(11)]);
    await as('authenticated',4,'INSERT INTO quotes(id,rfq_id,vendor_id,amount_cents) VALUES ($1,$2,$3,20000)',[id(1302),id(1300),id(12)]);
    await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,true,false)',[id(1300),id(1301)]);
    assert.equal((await as('authenticated',1,'SELECT can_user_review($1,$2,$3) ok',[id(1),id(12),id(1300)])).rows[0].ok,false);
    assert.equal((await as('authenticated',4,'SELECT wm_can_submit_quote($1,$2) ok',[id(1300),id(12)])).rows[0].ok,true);
    await as('authenticated',4,'INSERT INTO quotes(id,rfq_id,vendor_id,amount_cents) VALUES ($1,$2,$3,21000)',[id(1303),id(1300),id(12)]);
    await as('authenticated',4,"INSERT INTO quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES ($1,$2,$3,'vendor','Still open after the other booking')",[id(1300),id(12),id(4)]);
    let rows=(await as('authenticated',1,"SELECT * FROM list_inbox_threads_v2('client',1,false,'',$1)",[id(1300)])).rows;
    assert.equal(rows.filter(x=>x.accepted_here).length,1); assert.equal(rows.find(x=>x.invite.vendor_id===id(12)).rfq.accepted_quote_id,null);
    let contact=(await as('authenticated',4,'SELECT * FROM rfqs_visible WHERE id=$1',[id(1300)])).rows[0];
    assert.equal(contact.contact_email,null);assert.equal(contact.contact_phone,null);assert.equal(contact.accepted_quote_id,null);
    await assert.rejects(as('authenticated',1,'SELECT accept_vendor_quote($1,$2,false,true)',[id(1300),id(1302)]),{code:'22023'});
    await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,false,true)',[id(1300),id(1303)]);
    assert.equal((await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,true,false) result',[id(1300),id(1303)])).rows[0].result.alreadyAccepted,true);
    for (const [owner,vendor,email,phone,quote] of [[3,11,'isolated@example.invalid',null,1301],[4,12,null,'+15550000000',1303]]) {
      contact=(await as('authenticated',owner,'SELECT * FROM rfqs_visible WHERE id=$1',[id(1300)])).rows[0];
      assert.equal(contact.contact_email,email); assert.equal(contact.contact_phone,phone);assert.equal(contact.accepted_quote_id,id(quote));
      assert.equal((await as('authenticated',1,'SELECT can_user_review($1,$2,$3) ok',[id(1),id(vendor),id(1300)])).rows[0].ok,true);
      await as('authenticated',1,'INSERT INTO reviews(rfq_id,vendor_id,author_id,stars) VALUES ($1,$2,$3,5)',[id(1300),id(vendor),id(1)]);
      await as('authenticated',1,"INSERT INTO notifications(recipient_id,actor_id,type,title,data) VALUES ($1,$2,'vendor_quote_accepted','Isolated booking',$3)",[id(owner),id(1),{rfqId:id(1300),vendorId:id(vendor),quoteId:id(quote)}]);
    }
    assert.equal((await as('authenticated',4,'SELECT * FROM quote_messages WHERE rfq_id=$1 AND vendor_id=$2',[id(1300),id(11)])).rows.length,0);
    rows=(await as('authenticated',1,"SELECT * FROM list_inbox_threads_v2('client',1,false,'',$1)",[id(1300)])).rows;
    assert.equal(rows.filter(x=>x.accepted_here).length,2);
    assert.equal((await db.query('SELECT accepted_quote_id FROM rfqs WHERE id=$1',[id(1300)])).rows[0].accepted_quote_id,null);
    await deny('authenticated',3,'INSERT INTO quotes(rfq_id,vendor_id) VALUES ($1,$2)',[id(1300),id(11)]);
    await deny('authenticated',1,'UPDATE rfq_invites SET accepted_quote_id=null WHERE rfq_id=$1 AND vendor_id=$2',[id(1300),id(11)]);
    await deny('authenticated',4,'UPDATE rfq_invites SET accepted_quote_id=$1 WHERE rfq_id=$2 AND vendor_id=$3',[id(1301),id(1300),id(12)]);
    await deny('authenticated',1,"UPDATE rfq_invites SET status='invited' WHERE rfq_id=$1 AND vendor_id=$2",[id(1300),id(11)]);
    await deny('authenticated',1,"UPDATE rfq_invites SET status='accepted' WHERE rfq_id=$1 AND vendor_id=$2",[id(1100),id(13)]);
    await deny('authenticated',2,'SELECT accept_vendor_quote($1,$2,false,false)',[id(1300),id(1301)]);
    await db.query("UPDATE rfq_invites SET expires_at=now()-interval '1 day' WHERE rfq_id=$1",[id(1300)]);
    for (const [owner,vendor] of [[3,11],[4,12]]) await as('authenticated',owner,"INSERT INTO quote_messages(rfq_id,vendor_id,sender_id,sender_role,body) VALUES ($1,$2,$3,'vendor','Booked follow-up')",[id(1300),id(vendor),id(owner)]);
  });
  await t.test('the live verification script always rolls its fixtures back',async()=>{
    const result=await db.exec(await readFile(new URL('../docs/quote-flow-2026-10-19/live-transaction-check.sql',import.meta.url),'utf8'));
    const proof=result.at(-1).rows[0].workflow_verification;
    assert.equal(proof.fixturesRolledBack,true);assert.equal(proof.staleAcceptanceDenied,true);assert.equal(proof.preProposalMessages,true);
  });
  await t.test('independent-booking live verification uses isolated records and always rolls back',async()=>{
    const result=await db.exec(await readFile(new URL('../docs/independent-bookings-2026-10-20/live-transaction-check.sql',import.meta.url),'utf8'));
    const proof=result.at(-1).rows[0].workflow_verification;
    for (const key of ['fixturesRolledBack','independentBookings','separateReviews','perVendorConsent','perVendorBookingNotifications','bookingForgeryDenied','vendorIsolation']) assert.equal(proof[key],true,key);
  });

});
