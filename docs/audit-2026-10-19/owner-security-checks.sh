#!/usr/bin/env bash
# Run by the server owner as root. Read-only, no secrets or customer rows.
set -u
date -u '+%Y-%m-%dT%H:%M:%SZ'
printf '\nFirewall\n'
ufw status verbose
printf '\nSSH effective policy\n'
sshd -T | awk '$1 ~ /^(permitrootlogin|passwordauthentication|pubkeyauthentication|permitemptypasswords|maxauthtries|allowusers)$/ {print}'
printf '\nWedding Market PM2 metadata only\n'
sudo -u deploy -H pm2 jlist 2>/dev/null | node -e '
let s="";process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{
try {console.log(JSON.stringify(JSON.parse(s).filter(x=>x.name==="wedding-market").map(x=>({name:x.name,pid:x.pid,status:x.pm2_env?.status,restarts:x.pm2_env?.restart_time,started:x.pm2_env?.pm_uptime,node:x.pm2_env?.node_version,resources:x.monit})),null,2));}
catch {console.log("Unable to parse PM2 status");}});'
printf '\nOrigin certificate dates\n'
openssl x509 -in /etc/letsencrypt/live/thewedmarket.com/fullchain.pem -noout -dates -issuer
printf '\nRelevant rotation configuration\n'
sed -n '1,120p' /etc/logrotate.d/nginx
find /home/deploy/.pm2/logs -maxdepth 1 -type f -name '*wedding-market*' -printf '%s bytes %f\n'
printf '\nCredential validation: status only, no rows or values\n'
sudo -u deploy -H node <<'NODE'
const fs=require('fs');
const cp=require('child_process');
const raw=fs.readFileSync('/var/www/wedding-market/.env.production.local','utf8');
const env={};
for(const line of raw.split(/\r?\n/)){const m=line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[m[1]]=v;}}
// PM2-supplied variables take precedence over Next's .env file loading.
try {
 const proc=JSON.parse(cp.execFileSync('pm2',['jlist'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})).find(x=>x.name==='wedding-market');
 for(const name of ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_SERVICE_KEY']){
  const v=proc?.pm2_env?.[name]??proc?.pm2_env?.env?.[name];
  if(typeof v==='string')env[name]=v;
 }
} catch {console.log('pm2_credential_overrides=not_checked');}
const url=env.NEXT_PUBLIC_SUPABASE_URL??env.SUPABASE_URL;
const key=env.SUPABASE_SERVICE_ROLE_KEY??env.SUPABASE_SERVICE_KEY;
console.log('credential_variable='+(env.SUPABASE_SERVICE_ROLE_KEY!==undefined?'SUPABASE_SERVICE_ROLE_KEY':'SUPABASE_SERVICE_KEY'));
if(!url||!key){console.log('server_database_credential=not_configured_under_expected_names');process.exit(0);}
const target=new URL('/rest/v1/profiles?select=id&limit=0',url);
if(target.hostname!=='aousexbvujjnvbudpsmz.supabase.co'){console.log('server_database_credential=unexpected_project_not_queried');process.exit(0);}
fetch(target,{method:'HEAD',headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000)}).then(r=>console.log('server_database_credential_http_status='+r.status)).catch(()=>console.log('server_database_credential=request_failed'));
NODE
