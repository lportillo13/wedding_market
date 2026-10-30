import assert from 'node:assert/strict';
import test from 'node:test';
import type {SupabaseClient,User} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {NextRequest} from 'next/server';
import {accessCallback,accessContinuation,accessDestination,accessRequest,accessReturnPath,isAccountEntry,publicProviders,validEmailCode,type AccessProfile} from '../features/auth/domain/access';
import {coupleProfileSchema} from '../features/auth/domain/couple-profile';
import {coupleSignupIssue,type CoupleOnboardingData} from '../features/auth/domain/couple-onboarding';
import {completeCoupleProfile} from '../features/auth/server/complete-couple';
import {loadAccessAccount} from '../features/auth/server/access-account';
import {refreshBrowserSession} from '../lib/supabase/proxy';

const incomplete:AccessProfile={role:'user',full_name:'Example',phone:null,country:null,wedding_theme:null,tentative_wedding_date:null};
const input={full_name:'Example Couple',phone:'+1 202 555 0100',country:'United States',wedding_theme:'garden',tentative_wedding_date:'2027-04-12',guest_count:'',wedding_budget:'0',language:'es'};
const complete:AccessProfile={...incomplete,...input,guest_count:null,wedding_budget:0};
test('community consent is deferred only on account-entry routes, not on posting/contact destinations',()=>{
  for(const path of ['/login','/signup','/signup/choose','/signup/vendor','/auth/continue','/forgot-password','/reset-password'])assert.equal(isAccountEntry(path),true);
  for(const path of ['/rfq/new','/vendor/profile','/account/inbox','/signup-extra','/vendors'])assert.equal(isAccountEntry(path),false);
});

test('verified social/code accounts reuse role-appropriate workspaces and explicit return destinations',()=>{
  assert.equal(accessDestination(complete,false,'login','/account/inbox'),'/account/inbox');
  assert.equal(accessDestination(complete,true,'login','/account/profile'),'/account/profile');
  assert.equal(accessDestination(complete,true,'login','/account/profile',true),'/vendor/profile');
  assert.equal(accessDestination(incomplete,true,'couple','/signup'),'/vendor/profile');
  assert.equal(accessDestination({...incomplete,role:'admin'},false,'couple','/signup'),'/account/profile');
  assert.equal(accessDestination(complete,false,'vendor','/account/profile'),'/signup/vendor');
  assert.equal(accessDestination(incomplete,false,'vendor','/signup/vendor'),'/signup/vendor');
  const couple=new URL(accessDestination(incomplete,false,'couple','/rfq/new'),'https://example.invalid');
  assert.equal(couple.pathname,'/signup');assert.equal(couple.searchParams.get('complete'),'1');assert.equal(couple.searchParams.get('next'),'/rfq/new');
  assert.equal(new URL(accessDestination(incomplete,false,'login','/account/profile'),'https://example.invalid').pathname,'/signup/choose');
});
test('OAuth cancellation/retry retains account intent and local return paths without redirect loops',()=>{
  const callback=new URL(accessCallback('vendor','/vendor/inbox'),'https://example.invalid');
  assert.equal(callback.pathname,'/auth/callback');
  assert.deepEqual(accessRequest(callback.searchParams.get('next'),null),{intent:'vendor',next:'/vendor/inbox'});
  assert.deepEqual(accessRequest(accessContinuation('login','/account/profile',true),null),{intent:'login',next:'/account/profile',defaultWorkspace:true});
  for(const unsafe of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','/auth/continue?next=/auth/continue','/login','/auth/callback','/signup/choose'])assert.equal(accessReturnPath(unsafe),'/account/profile');
  assert.equal(accessContinuation('couple','//evil.invalid'),'/auth/continue?intent=couple&next=%2Faccount%2Fprofile');
});
test('email codes accept configured numeric lengths and provider availability never trusts truthy strings',()=>{
  assert.equal(validEmailCode('123 456'),true);assert.equal(validEmailCode('12345678'),true);
  for(const code of ['12345','12345678901','abcdef','<script>'])assert.equal(validEmailCode(code),false);
  assert.deepEqual(publicProviders({external:{google:true,apple:'true',email:true},secret:'never returned'}),{google:true,apple:false});
  assert.deepEqual(publicProviders(null),{google:false,apple:false});
});
test('verified couple setup skips passwords but preserves contact/style/date requirements and optional estimates',()=>{
  const data:CoupleOnboardingData={...input,email:'example@example.invalid',password:'',wedding_budget:'',guest_count:''};
  assert.equal(coupleSignupIssue(data,0,true),null);
  assert.equal(coupleSignupIssue(data,0),'passwordRequired');
  assert.equal(coupleSignupIssue({...data,country:''},1,true),'countryRequired');
  const parsed=coupleProfileSchema.parse({...input,id:'other',role:'admin',email:'different@example.invalid'});
  assert.equal(parsed.guest_count,null);assert.equal(parsed.wedding_budget,0);assert.equal('role' in parsed,false);assert.equal('email' in parsed,false);
  assert.equal(coupleProfileSchema.safeParse({...input,tentative_wedding_date:'2027-02-30'}).success,false);
  assert.equal(coupleProfileSchema.safeParse({...input,guest_count:'12people'}).success,false);
});
test('couple completion writes only the verified own profile and cannot promote a role or create another identity',async()=>{
  const user={id:'own',email:'example@example.invalid',email_confirmed_at:'2026-10-30'} as User;
  let calls=0;
  const update=async(id:string,values:unknown)=>{calls++;assert.equal(id,'own');assert.equal('role' in (values as object),false);return {error:null};};
  for(const account of [null,{user:{...user,email_confirmed_at:undefined},profile:incomplete,isVendor:false},{user,profile:{...incomplete,role:'admin'},isVendor:false},{user,profile:incomplete,isVendor:true}])assert.equal((await completeCoupleProfile(account,input,update)).ok,false);
  assert.equal(calls,0);
  assert.equal((await completeCoupleProfile({user,profile:incomplete,isVendor:false},{...input,role:'admin',id:'other'},update)).ok,true);
  assert.equal(calls,1);
  assert.equal((await completeCoupleProfile({user,profile:incomplete,isVendor:false},input,async()=>({error:new Error('denied')}))).ok,false);
});
test('post-auth account lookup derives its only identity from getUser and stops on missing auth',async()=>{
  let reads=0;
  const guest={auth:{getUser:async()=>({data:{user:null},error:null})},from:()=>{reads++;throw Error('No lookup');}} as unknown as SupabaseClient;
  assert.equal((await loadAccessAccount(guest)).status,'guest');assert.equal(reads,0);
  const own={auth:{getUser:async()=>({data:{user:{id:'own'}},error:null})},from:()=>({select:()=>({eq:(key:string,id:string)=>{assert.equal(key,'id');assert.equal(id,'own');return {maybeSingle:async()=>({data:incomplete,error:null})};}})}),rpc:async(_name:string,args:{_uid:string})=>{assert.equal(args._uid,'own');return {data:false,error:null};}} as unknown as SupabaseClient;
  assert.equal((await loadAccessAccount(own)).status,'ready');
});
test('session refresh skips guests and preserves all refreshed chunks, removals and no-cache headers',async()=>{
  let calls=0;
  const factory=((_url:string,_key:string,options:{cookies:{getAll:()=>unknown;setAll:(values:{name:string;value:string;options:object}[],headers:Record<string,string>)=>void}})=>({auth:{getClaims:async()=>{calls++;options.cookies.setAll([{name:'sb-example-auth-token.0',value:'synthetic-a',options:{maxAge:3600}}],{'Cache-Control':'private, no-store'});options.cookies.setAll([{name:'sb-example-auth-token.1',value:'synthetic-b',options:{}},{name:'sb-example-auth-token.2',value:'',options:{maxAge:0}}],{Expires:'0',Pragma:'no-cache'});return {data:{claims:{sub:'own'}},error:null};}}})) as unknown as typeof createServerClient;
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='synthetic-public-key';
  try{
    await refreshBrowserSession(new NextRequest('https://example.invalid/account/profile'),factory);assert.equal(calls,0);
    const request=new NextRequest('https://example.invalid/account/profile',{headers:{cookie:'sb-example-auth-token.0=synthetic-old'}});
    const result=await refreshBrowserSession(request,factory);assert.equal(calls,1);
    assert.equal(request.cookies.get('sb-example-auth-token.1')?.value,'synthetic-b');
    assert.equal(result.cookies.get('sb-example-auth-token.0')?.value,'synthetic-a');assert.equal(result.cookies.get('sb-example-auth-token.1')?.value,'synthetic-b');assert.equal(result.cookies.get('sb-example-auth-token.2')?.maxAge,0);
    assert.match(result.headers.get('cache-control')??'',/private.*no-store/);assert.equal(result.headers.get('expires'),'0');
  }finally{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;}
});

test('a slow session refresh cannot write cookies after its response deadline',async()=>{
  const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='synthetic-public-key';
  let finished:Promise<void>=Promise.resolve();
  const factory=((_url:unknown,_key:unknown,options:{cookies:{setAll:(cookies:unknown[],headers:Record<string,string>)=>void}})=>({auth:{getClaims:()=>{finished=new Promise(resolve=>setTimeout(()=>{options.cookies.setAll([{name:'sb-example-auth-token',value:'late-synthetic-token',options:{}}],{});resolve();},25));return finished;}}})) as unknown as typeof createServerClient;
  try{
    const result=await refreshBrowserSession(new NextRequest('https://example.invalid/account/profile',{headers:{cookie:'sb-example-auth-token=synthetic-old'}}),factory,2);
    await finished;
    assert.equal(result.cookies.getAll().length,0);assert.match(result.headers.get('cache-control')??'',/private.*no-store/);
  }finally{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;}
});
