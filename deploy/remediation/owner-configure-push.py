#!/usr/bin/env python3
"""Owner-run, one-app Expo sender update. Never prints or exports credentials."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import urllib.request

APP = Path('/var/www/wedding-market')
PAYLOAD = Path('/home/wm-audit-20261019/owner-backup-readiness-20261027/wedding-market-expo-sender.json')
RECEIPT = Path('/home/wm-audit-20261019/owner-push-configuration-results.json')

def setting_present(text, name):
    matches=re.findall(r'^\s*(?:export\s+)?'+re.escape(name)+r'\s*=\s*(.*?)\s*$',text,re.M)
    return any(value.strip().strip('\"\'').strip() for value in matches)

def updated_env(text, token):
    lines = text.splitlines()
    matches = [i for i, line in enumerate(lines) if re.match(r'^\s*(?:export\s+)?EXPO_ACCESS_TOKEN\s*=', line)]
    if len(matches) > 1:
        raise ValueError('Duplicate sender settings require review')
    line = 'EXPO_ACCESS_TOKEN=' + token
    if matches:
        lines[matches[0]] = line
    else:
        lines.append(line)
    return '\n'.join(lines) + '\n'

def atomic(target, data):
    info = target.stat()
    descriptor, temporary = tempfile.mkstemp(prefix='.wm-sender-', dir=target.parent)
    try:
        with os.fdopen(descriptor, 'wb') as output:
            output.write(data)
        os.chmod(temporary, info.st_mode & 0o777)
        os.chown(temporary, info.st_uid, info.st_gid)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary): os.unlink(temporary)

def restart(token):
    # The secret is transferred over stdin, never argv or stdout. PM2 affects only WM.
    code = """const fs=require('node:fs'),cp=require('node:child_process');
const token=JSON.parse(fs.readFileSync(0,'utf8')).token;
const env={...process.env,EXPO_ACCESS_TOKEN:token,HOME:'/home/deploy',PM2_HOME:'/home/deploy/.pm2'};
for(const args of [['restart','wedding-market','--update-env'],['save','--force']]){
 const r=cp.spawnSync('/usr/bin/pm2',args,{env,stdio:'ignore',timeout:30000});
 if(r.status!==0)process.exit(1);
}
fs.chmodSync('/home/deploy/.pm2/dump.pm2',0o600);
"""
    subprocess.run(['/usr/sbin/runuser','-u','deploy','--','/usr/bin/node','-e',code],
                   input=json.dumps({'token':token}),text=True,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,
                   env={'PATH':'/usr/bin:/bin','HOME':'/home/deploy','PM2_HOME':'/home/deploy/.pm2'},timeout=70000,cwd=APP)

def main():
    import fcntl
    if os.geteuid() != 0: raise ValueError('Use owner root terminal')
    os.umask(0o077)
    with open('/var/backups/wedding-market-deploy/gateway-execution.lock','a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        active=APP.resolve(strict=True)
        if active.parent != Path('/var/www/wedding-market-releases') or not re.fullmatch(r'\d{8}-\d{6}-[a-f0-9]{12}',active.name):
            raise ValueError('Unexpected active app path')
        if PAYLOAD.is_symlink() or PAYLOAD.stat().st_size>4096: raise ValueError('Unexpected sender payload')
        sender=json.loads(PAYLOAD.read_text())
        if sender.get('robot')!='Wedding Market message delivery' or sender.get('role')!='Viewer' or not re.fullmatch(r'[A-Za-z0-9_-]{40}',sender.get('token','')):
            raise ValueError('Unexpected sender scope')
        token=sender['token']
        targets=[active/'.env.production.local',active/'.next/standalone/.env.production.local']
        for target in targets:
            if target.is_symlink() or not target.is_file(): raise ValueError('Expected private app configuration')
        originals={p:p.read_bytes() for p in targets}
        before='\n'.join(data.decode() for data in originals.values())
        was_configured=setting_present(before,'EXPO_ACCESS_TOKEN')
        for target in targets: atomic(target,updated_env(originals[target].decode(),token).encode())
        restart(token)
        healthy=False
        for _ in range(10):
            try:
                with urllib.request.urlopen('http://127.0.0.1:3001/api/health',timeout=3) as response:
                    healthy=response.status==200
                if healthy: break
            except Exception: time.sleep(1)
        if not healthy:
            for target in targets: atomic(target,originals[target])
            raise ValueError('Sender saved but health failed; files restored, owner review required')
        PAYLOAD.unlink()
        result={'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'scope':'Wedding Market only',
                'previousSenderSettingPresent':was_configured,'senderConfigured':True,'weddingMarketRestarted':True,
                'healthPassed':True,'credentialsPrinted':False,'otherAppsChanged':False,
                'mailApiKeySettingPresent':setting_present(before,'RESEND_API_KEY'),
                'mailFromSettingPresent':setting_present(before,'RESEND_FROM_EMAIL'),
                'isolatedPostgresBinaryAvailable':Path('/usr/lib/postgresql/17/bin/postgres').is_file()}
        uid=int(subprocess.check_output(['id','-u','wm-audit-20261019'],text=True))
        gid=int(subprocess.check_output(['id','-g','wm-audit-20261019'],text=True))
        RECEIPT.write_text(json.dumps(result,indent=2)+'\n');os.chmod(RECEIPT,0o600);os.chown(RECEIPT,uid,gid)
        print(json.dumps(result))

if __name__=='__main__':
    try: main()
    except Exception:
        print('Wedding Market sender configuration stopped. No credential was printed. Review the scoped owner helper.')
        raise SystemExit(1)
