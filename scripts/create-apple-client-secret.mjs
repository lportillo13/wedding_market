import {createPrivateKey,sign} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

/** Sign locally. Private keys and generated tokens must never enter app code or logs. */
export function createAppleClientSecret({privateKey,teamId,keyId,clientId,now=Math.floor(Date.now()/1000)}) {
  if(!/^[A-Z0-9]{10}$/.test(teamId)||!/^[A-Z0-9]{10}$/.test(keyId)||!/^[a-z0-9]+(?:\.[a-z0-9-]+)+$/i.test(clientId))throw new Error('Check the Apple team, key and Services IDs.');
  if(!Number.isSafeInteger(now)||now<0)throw new Error('Invalid issue time.');
  const key=createPrivateKey(privateKey);
  if(key.asymmetricKeyType!=='ec'||key.asymmetricKeyDetails?.namedCurve!=='prime256v1')throw new Error('Use the Apple ES256 signing key.');
  const expires=now+180*24*60*60;
  const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const input=encode({alg:'ES256',kid:keyId})+'.'+encode({iss:teamId,iat:now,exp:expires,aud:'https://appleid.apple.com',sub:clientId});
  const signature=sign('sha256',Buffer.from(input),{key,dsaEncoding:'ieee-p1363'}).toString('base64url');
  return {token:input+'.'+signature,expiresAt:new Date(expires*1000).toISOString()};
}

async function main() {
  const entries=process.argv.slice(2),values={};
  for(let index=0;index<entries.length;index+=2){const name=entries[index];if(!['--key-file','--team-id','--key-id','--client-id'].includes(name)||!entries[index+1])throw new Error('Pass --key-file, --team-id, --key-id and --client-id.');values[name]=entries[index+1];}
  const result=createAppleClientSecret({privateKey:await readFile(values['--key-file'],'utf8'),teamId:values['--team-id'],keyId:values['--key-id'],clientId:values['--client-id']});
  const folder=resolve('.cache/auth-access');await mkdir(folder,{recursive:true});
  const file=resolve(folder,'apple-client-secret.txt');
  await writeFile(file,result.token+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
  console.log(JSON.stringify({file,expiresAt:result.expiresAt,notice:'Copy this file directly into the Supabase Apple provider; do not share its contents in chat.'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(()=>{console.error('No secret was printed. Check the key file/identifiers and whether the output file already exists.');process.exitCode=1;});
