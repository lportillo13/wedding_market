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
    await db.query('UPDATE rfqs SET accepted_quote_id=$1 WHERE id=$2', [id(31),id(21)]);
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
  await t.test('acceptance verifies ownership, closes competing invitations, and is idempotent',async()=>{
    await db.exec(`INSERT INTO rfq_invites(rfq_id,vendor_id,expires_at) VALUES ('${id(23)}','${id(11)}',now()+interval '1 day'),('${id(23)}','${id(12)}',now()+interval '1 day');
      INSERT INTO quotes(id,rfq_id,vendor_id) VALUES ('${id(33)}','${id(23)}','${id(11)}');`);
    await deny('authenticated',2,'SELECT accept_vendor_quote($1,$2,false,false)',[id(23),id(33)]);
    await deny('authenticated',1,'UPDATE rfqs SET accepted_quote_id=$1 WHERE id=$2',[id(31),id(23)]);
    await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,true,false)',[id(23),id(33)]);
    assert.equal((await db.query('SELECT status FROM rfq_invites WHERE rfq_id=$1 AND vendor_id=$2',[id(23),id(12)])).rows[0].status,'declined');
    assert.equal((await as('authenticated',1,'SELECT accept_vendor_quote($1,$2,true,false) AS result',[id(23),id(33)])).rows[0].result.alreadyAccepted,true);
    await deny('authenticated',1,'UPDATE rfqs SET accepted_quote_id=null,accepted_at=null WHERE id=$1',[id(23)]);
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
});
