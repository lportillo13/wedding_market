import assert from 'node:assert/strict';
import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import type {User} from '@supabase/supabase-js';
import {loadPersonalProfile} from '../features/accounts/server/personal-profile';
import {AccountHeaderContent} from '../app/account/AccountLayoutHeader';
import ProfilePageContent from '../app/account/profile/ProfilePageContent';
import {LanguageProvider} from '../contexts/LanguageContext';
import {AppRouterContext} from 'next/dist/shared/lib/app-router-context.shared-runtime';

const user = {id:'verified-account',email:'account@example.invalid'} as User;
const profile = {role:'admin',full_name:'Example Account',phone:null,country:'Costa Rica',tentative_wedding_date:null,guest_count:null,wedding_budget:null,wedding_theme:null,language:'es'};

test('verified admin, vendor and client accounts can load their own personal details', async () => {
  for (const role of ['admin','vendor','user']) {
    const result = await loadPersonalProfile({
      getUser: async () => ({data:{user},error:null}),
      readOwnProfile: async id => {
        assert.equal(id, user.id);
        return {data:{...profile,role},error:null};
      },
    });
    assert.equal(result.status,'ready');
    if (result.status === 'ready') {
      assert.equal(result.profile.role,role);
      assert.equal(result.user.id,user.id);
      assert.equal(result.profile.country,'Costa Rica');
    }
  }
});

test('missing or invalid authentication never performs a personal-profile lookup', async () => {
  for (const auth of [{data:{user:null},error:null},{data:{user},error:new Error('Expired session')}]) {
    const result = await loadPersonalProfile({getUser:async()=>auth,readOwnProfile:async()=>{assert.fail('Unauthenticated profile lookup');}});
    assert.equal(result.status,'guest');
  }
});

test('an absent or inaccessible profile does not become a blank editable account', async () => {
  for (const result of [{data:null,error:null},{data:profile,error:new Error('Permission denied')}]) {
    const loaded = await loadPersonalProfile({getUser:async()=>({data:{user},error:null}),readOwnProfile:async()=>result});
    assert.equal(loaded.status,'unavailable');
  }
});

test('personal profile access exposes couple workspace links only to client accounts', () => {
  const labels = {heading:'My account',navigation:'Account sections',tabs:{profile:'Profile',inbox:'Inbox',reviews:'Reviews'}};
  const personal = renderToStaticMarkup(<AccountHeaderContent pathname="/account/profile" labels={labels} clientWorkspace={false}/>);
  assert.match(personal,/href="\/account\/profile"/);
  assert.doesNotMatch(personal,/href="\/account\/(inbox|reviews)"/);
  const client = renderToStaticMarkup(<AccountHeaderContent pathname="/account/profile" labels={labels}/>);
  assert.match(client,/href="\/account\/inbox"/);
  assert.match(client,/href="\/account\/reviews"/);
});

test('the bilingual personal editor preserves credential email and optional planning fields', () => {
  for (const language of ['en', 'es'] as const) {
    const markup = renderToStaticMarkup(
      <AppRouterContext.Provider value={{refresh() {}} as never}>
        <LanguageProvider initialLanguage={language}>
          <ProfilePageContent initial={{full_name:'Example Couple',phone:'',email:'couple@example.invalid',country:'Canada',tentative_wedding_date:'',guest_count:null,wedding_budget:null,wedding_theme:'',language}} avatarImage={null} />
        </LanguageProvider>
      </AppRouterContext.Provider>,
    );
    const inputs = [...markup.matchAll(/<(?:input|select)\b[^>]*>/g)].map(match => match[0]);
    const email = inputs.find(tag => tag.includes('id="profile-email"'))!;
    assert.match(email, /disabled=""/);
    assert.match(email, /readOnly=""/);
    assert.doesNotMatch(email, /\bname=/);
    for (const name of ['full_name','phone','country','language','tentative_wedding_date','guest_count','wedding_budget','wedding_theme']) {
      assert.ok(inputs.some(tag => tag.includes(`name="${name}"`)), `Missing submitted field ${name}`);
    }
    for (const name of ['guest_count','wedding_budget']) {
      assert.doesNotMatch(inputs.find(tag => tag.includes(`name="${name}"`))!, /required/);
    }
    assert.match(markup, language === 'en' ? /Contact country/ : /País de contacto/);
    assert.match(markup, /Costa Rica/);
    assert.match(markup, language === 'en' ? /Choose photo/ : /Elegir foto/);
    assert.doesNotMatch(markup, /type="submit"[^>]*>Upload photo|type="submit"[^>]*>Subir foto/);
  }
});
