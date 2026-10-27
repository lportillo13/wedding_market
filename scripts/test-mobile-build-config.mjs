import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const configure=require('../mobile/app.config.js');
test('remote Android builds fail before consuming build resources if push configuration is missing or foreign',()=>{
 const names=['WM_ANDROID_GOOGLE_SERVICES_FILE','EAS_BUILD','EAS_BUILD_PLATFORM','EXPO_PUBLIC_WEB_API_URL','EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_ANON_KEY'];
 const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 const directory=fs.mkdtempSync(path.resolve('.cache/build-config-'));
 try{
  process.env.EAS_BUILD='true';process.env.EAS_BUILD_PLATFORM='android';delete process.env.WM_ANDROID_GOOGLE_SERVICES_FILE;
  assert.throws(()=>configure({config:{}}),/WM_ANDROID_GOOGLE_SERVICES_FILE/);
  const file=path.join(directory,'client.json');process.env.WM_ANDROID_GOOGLE_SERVICES_FILE=file;
  fs.writeFileSync(file,JSON.stringify({project_info:{project_id:'another-project'},client:[]}));
  assert.throws(()=>configure({config:{}}),/Wedding Market/);
  fs.writeFileSync(file,JSON.stringify({project_info:{project_id:'the-wedding-market-a627b'},client:[{client_info:{android_client_info:{package_name:'com.theweddingmarket.app'}}}],private_key:'never bundle'}));
  assert.throws(()=>configure({config:{}}),/private key/);
  fs.writeFileSync(file,JSON.stringify({project_info:{project_id:'the-wedding-market-a627b'},client:[{client_info:{android_client_info:{package_name:'com.theweddingmarket.app'}}}]}));
  process.env.EXPO_PUBLIC_WEB_API_URL='https://thewedmarket.com';process.env.EXPO_PUBLIC_SUPABASE_URL='https://aousexbvujjnvbudpsmz.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY=`header.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.signature`;
  assert.throws(()=>configure({config:{}}),/public Supabase key/);
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY='sb_publishable_fixture';
  assert.equal(configure({config:{}}).android.googleServicesFile,file);
 }finally{
  for(const name of names){if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];}
  const resolved=path.resolve(directory);if(!resolved.startsWith(path.resolve('.cache')+path.sep))throw Error('Unsafe fixture path');fs.rmSync(resolved,{recursive:true,force:true});
 }
});
