/* global fetch, AbortSignal */
import fs from 'node:fs';
import console from 'node:console';
import { Buffer } from 'node:buffer';

const origin = 'https://thewedmarket.com';
const paths = ['/', '/api/health', '/api/vendors?pageSize=1', '/api/content/site-settings?lang=en', '/api/admin/site-settings', '/api/admin/blog-posts', '/api/admin/vendor-ads', '/private-control-room-hub', '/api/whoami'];
const selectedHeaders = ['content-type','content-length','cache-control','strict-transport-security','content-security-policy','x-content-type-options','x-frame-options','referrer-policy','permissions-policy','access-control-allow-origin','server','x-powered-by','location','content-encoding'];
const output={collectedAt:new Date().toISOString(),origin,checks:[]};
for(const path of paths){
  const started=Date.now();
  try{
    const response=await fetch(origin+path,{signal:AbortSignal.timeout(15000),redirect:'manual',headers:{'User-Agent':'WeddingMarket-Owner-Audit/1.0'}});
    const body=await response.text();
    const check={path,status:response.status,elapsedMs:Date.now()-started,bytes:Buffer.byteLength(body),headers:Object.fromEntries(selectedHeaders.filter(k=>response.headers.has(k)).map(k=>[k,response.headers.get(k)]))};
    if(response.headers.get('content-type')?.includes('application/json')){
      try{const d=JSON.parse(body); check.jsonKeys=Object.keys(d); if(d.error) check.error=String(d.error).slice(0,150); if(Array.isArray(d.items)){check.itemCount=d.items.length; check.itemFields=d.items[0]?Object.keys(d.items[0]):[];} if('user' in d) check.authenticated=!!d.user;}catch{ /* Record status and size when a body is not valid JSON. */ }
    }
    output.checks.push(check);
  }catch(e){output.checks.push({path,error:e.cause?.code??e.name,elapsedMs:Date.now()-started});}
}
fs.writeFileSync('docs/audit-2026-10-19/public-http.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
