import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const forbidden=file=>/(^|\/)(?:\.git|node_modules|\.cache|dist|\.expo)(\/|$)|(^|\/)\.env|credentials\.json$|service-account|\.(?:pem|key|p8|p12|jks|keystore)$/i.test(file);
async function walk(root,relative='') {
  const result=[];
  for(const entry of await fs.readdir(path.join(root,relative),{withFileTypes:true})) {
    const name=path.posix.join(relative,entry.name);
    if(entry.isSymbolicLink())throw Error('Source archives must not contain symlinks.');
    if(entry.isDirectory())result.push(...await walk(root,name));else result.push(name);
    if(result.length>1000)throw Error('Source archive exceeds the 1,000-file budget.');
  }
  return result.sort();
}
export async function inspectSourceArchive(root,archive) {
  if((await fs.lstat(archive)).isSymbolicLink())throw Error('Archive root must not be a symlink.');
  const config=['mobile/App.tsx','mobile/package.json','mobile/package-lock.json','mobile/app.json','mobile/eas.json','mobile/metro.config.js','mobile/tsconfig.json'];
  const expected=[...config,...await walk(root,'mobile/src'),...await walk(root,'mobile/assets'),...await walk(root,'shared')].filter(file=>!forbidden(file)).sort();
  const actual=await walk(archive);
  const extra=actual.filter(file=>!expected.includes(file));const missing=expected.filter(file=>!actual.includes(file));
  const mismatched=[],sensitive=[];const hashes=[];let bytes=0;
  for(const file of actual) {
    const content=await fs.readFile(path.join(archive,file));bytes+=content.length;
    if(forbidden(file))sensitive.push(file);
    if(/\.(?:tsx?|jsx?|json)$/.test(file)) {
      const text=content.toString('utf8');
      if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|"private_key"\s*:|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'`][^"'`]+/i.test(text))sensitive.push(file);
      for(const token of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
        try {if(JSON.parse(Buffer.from(token[1],'base64url').toString()).role==='service_role')sensitive.push(file);}catch{/* Not a JWT. */}
      }
    }
    const sha256=digest(content);hashes.push({file,sha256,bytes:content.length});
    if(expected.includes(file)&&sha256!==digest(await fs.readFile(path.join(root,file))))mismatched.push(file);
  }
  return {checkedAt:new Date().toISOString(),passed:!extra.length&&!missing.length&&!mismatched.length&&!sensitive.length&&bytes<=10*1024*1024,
    files:actual.length,bytes,budgets:{maxFiles:1000,maxBytes:10*1024*1024},extra,missing,mismatched,sensitive:[...new Set(sensitive)],fingerprint:digest(JSON.stringify(hashes)),hashes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [, ,archive,output]=process.argv;
  if(!archive||!output)throw Error('Provide the actual EAS archive directory and output report.');
  const report=await inspectSourceArchive(process.cwd(),archive);
  await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,hashes:undefined}));if(!report.passed)process.exitCode=1;
}
