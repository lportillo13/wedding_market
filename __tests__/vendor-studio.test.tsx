import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {AppRouterContext} from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {PathnameContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import {LanguageProvider} from '../contexts/LanguageContext';
import {VendorWorkspaceProvider} from '../app/vendor/VendorWorkspaceContext';
import VendorDashboardHeader from '../app/vendor/VendorDashboardHeader';
import ProfileForm from '../app/vendor/profile/profileForm';
import {vendorBusinessGroup, vendorWorkspaceArea, isVendorProfileSection} from '../app/vendor/workspace-navigation';
import {saveVendorStartingPrice} from '../features/vendors/server/starting-price';
import {loadOwnVendorPreview} from '../features/vendors/server/workspace-preview';
import type {User} from '@supabase/supabase-js';

test('vendor navigation retains every editor destination in coherent groups and matches route boundaries', () => {
  for (const section of ['pricing','starting-price','amenities','categories'] as const) assert.equal(vendorBusinessGroup(section),'services');
  for (const section of ['contact','location'] as const) assert.equal(vendorBusinessGroup(section),'contact');
  assert.equal(vendorWorkspaceArea('/vendor/profile','availability'),'calendar');
  assert.equal(vendorWorkspaceArea('/vendor/inbox/thread','details'),'inbox');
  assert.equal(vendorWorkspaceArea('/vendor/preview','images'),'business');
  assert.equal(vendorWorkspaceArea('/vendor/profile-other','details'),'home');
  for (const section of ['details','images','pricing','amenities','contact','team','reviews','availability','categories','location','starting-price']) assert.ok(isVendorProfileSection(section));
  assert.equal(isVendorProfileSection('untrusted'),false);
});

test('the bilingual studio retains operational links, clear publication state and conditional boutique tools', () => {
  for (const language of ['en','es'] as const) for (const hasBoutique of [false,true]) {
    const html=renderToStaticMarkup(<AppRouterContext.Provider value={{} as never}><PathnameContext.Provider value="/vendor/profile"><LanguageProvider initialLanguage={language}><VendorWorkspaceProvider summary={{businessName:'Example Business',slug:'example',isPublished:false,hasBoutique}}><VendorDashboardHeader/></VendorWorkspaceProvider></LanguageProvider></PathnameContext.Provider></AppRouterContext.Provider>);
    for (const path of ['/vendor/inbox','/vendor/profile#details','/vendor/profile#images','/vendor/profile#pricing','/vendor/profile#contact','/vendor/profile#availability','/vendor/profile#team','/vendor/profile#reviews','/vendor/publish']) assert.ok(html.includes(`href="${path}"`),path);
    assert.equal(html.includes('href="/vendor/boutique"'),hasBoutique);
    assert.doesNotMatch(html,/href="\/vendors\/example"/);
    assert.match(html,language==='es'?/Borrador privado/:/Private draft/);
    assert.match(html,/optgroup/);
  }
});

test('collapsing presentation details retains every submitted field once in both languages', () => {
  for (const language of ['en','es'] as const) {
    const html=renderToStaticMarkup(<LanguageProvider initialLanguage={language}><ProfileForm initial={{business_name:'Example',slug:'example',bio_en:'English',bio_es:'Español',extra_info_en:'Extra',extra_info_es:'Más'}}/></LanguageProvider>);
    for (const name of ['business_name','slug','bio_en','bio_es','extra_info_en','extra_info_es']) assert.equal([...html.matchAll(new RegExp(`name="${name}"`,'g'))].length,1,name);
    assert.match(html,/<details class="wm-studio-form-details"/);
  }
});

test('starting-price saves are owned, narrowly scoped and preserve optional and zero prices', async () => {
  const updates:unknown[]=[];
  const update=async(id:string,values:unknown)=>{updates.push({id,values});return {error:null};};
  assert.equal((await saveVendorStartingPrice(null,{price:'1',currency:'USD'},update)).ok,false);
  assert.equal((await saveVendorStartingPrice({id:'owned',starting_price_currency:'USD'},{price:'-1',currency:'USD'},update)).ok,false);
  assert.equal((await saveVendorStartingPrice({id:'owned',starting_price_currency:'USD'},{price:'1',currency:'US'},update)).ok,false);
  assert.equal(updates.length,0);
  assert.equal((await saveVendorStartingPrice({id:'owned',starting_price_currency:'USD'},{price:'0',currency:'crc'},update)).ok,true);
  assert.deepEqual(updates[0],{id:'owned',values:{starting_price_cents:0,starting_price_currency:'CRC'}});
  assert.equal((await saveVendorStartingPrice({id:'owned',starting_price_currency:'USD'},{price:'',currency:''},update)).ok,true);
  assert.deepEqual(updates[1],{id:'owned',values:{starting_price_cents:null,starting_price_currency:null}});
  assert.equal((await saveVendorStartingPrice({id:'owned',starting_price_currency:'USD'},{price:'20',currency:'USD'},async()=>({error:new Error('Denied')}))).ok,false);
});

test('private vendor previews read only the authenticated owner and never look up a guest', async () => {
  const guest=await loadOwnVendorPreview({getUser:async()=>({data:{user:null},error:null}),readOwnVendor:async()=>{assert.fail('Guest lookup');}});
  assert.equal(guest.status,'guest');
  const own=await loadOwnVendorPreview({getUser:async()=>({data:{user:{id:'owned-user'} as User},error:null}),readOwnVendor:async id=>{assert.equal(id,'owned-user');return {data:{business_name:'Owned'},error:null};}});
  assert.deepEqual(own,{status:'ready',vendor:{business_name:'Owned'}});
});
