#!/usr/bin/env python3
"""Owner-run Wedding Market transactional mail configuration; no credential output."""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.request

def update_settings(text, settings):
    lines=text.splitlines()
    for name,value in settings.items():
        if not re.fullmatch(r'[A-Z_]+',name) or any(c in value for c in '\r\n\0'): raise ValueError('Unsafe setting')
        found=[i for i,line in enumerate(lines) if re.match(r'^\s*(?:export\s+)?'+name+r'\s*=',line)]
        if len(found)>1: raise ValueError('Duplicate mail setting')
        line=name+'='+json.dumps(value)
        if found: lines[found[0]]=line
        else: lines.append(line)
    return '\n'.join(lines)+'\n'

def main():
    import fcntl
    if os.geteuid()!=0: raise ValueError('Use owner root terminal')
    os.umask(0o077)
    source=Path('/root/wm-configure-push-20261027.py')
    # Reuse only the earlier owner-installed, checksum-pinned atomic file helper.
    import hashlib
    if source.is_symlink() or hashlib.sha256(source.read_bytes()).hexdigest()!='716b6d45973fb4725d650de44439154157a6aac057b3c900dac777e39f8b2d3f': raise ValueError('Reviewed installed helper required')
    spec=importlib.util.spec_from_file_location('wm_owner_atomic',source)
    helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
    payload=Path('/home/wm-audit-20261019/owner-backup-readiness-20261027/wedding-market-mail-sender.json')
    if payload.is_symlink() or payload.stat().st_size>4096: raise ValueError('Unexpected mail payload')
    mail=json.loads(payload.read_text())
    if mail.get('name')!='wm-app-transactional-launch' or mail.get('permission')!='sending_access' or mail.get('domain')!='mail.thewedmarket.com' or not re.fullmatch(r're_[A-Za-z0-9_-]{20,160}',mail.get('token','')): raise ValueError('Unexpected mail scope')
    settings={'RESEND_API_KEY':mail['token'],'RESEND_FROM_EMAIL':'The Wedding Market <accounts@mail.thewedmarket.com>','RESEND_REPLY_TO':'hello@thewedmarket.com'}
    with open('/var/backups/wedding-market-deploy/gateway-execution.lock','a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        active=Path('/var/www/wedding-market').resolve(strict=True)
        if active.parent!=Path('/var/www/wedding-market-releases') or not re.fullmatch(r'\d{8}-\d{6}-[a-f0-9]{12}',active.name): raise ValueError('Unexpected active app')
        targets=[active/'.env.production.local',active/'.next/standalone/.env.production.local']
        for target in targets:
            if target.is_symlink() or not target.is_file(): raise ValueError('Expected private configuration')
        original={target:target.read_bytes() for target in targets}
        for target in targets: helper.atomic(target,update_settings(original[target].decode(),settings).encode())
        code="""const fs=require('node:fs'),cp=require('node:child_process');const settings=JSON.parse(fs.readFileSync(0,'utf8'));const env={...process.env,...settings,HOME:'/home/deploy',PM2_HOME:'/home/deploy/.pm2'};for(const args of [['restart','wedding-market','--update-env'],['save','--force']]){const r=cp.spawnSync('/usr/bin/pm2',args,{env,stdio:'ignore',timeout:30000});if(r.status!==0)process.exit(1);}fs.chmodSync('/home/deploy/.pm2/dump.pm2',0o600);"""
        subprocess.run(['/usr/sbin/runuser','-u','deploy','--','/usr/bin/node','-e',code],input=json.dumps(settings),text=True,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,env={'PATH':'/usr/bin:/bin','HOME':'/home/deploy','PM2_HOME':'/home/deploy/.pm2'},cwd=active,timeout=70000)
        healthy=False
        for _ in range(10):
            try:
                with urllib.request.urlopen('http://127.0.0.1:3001/api/health',timeout=3) as response: healthy=response.status==200
                if healthy: break
            except Exception: time.sleep(1)
        if not healthy:
            for target in targets: helper.atomic(target,original[target])
            raise ValueError('Health failed; files restored; owner review required')
        payload.unlink()
        result={'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'scope':'Wedding Market only','mailSenderConfigured':True,'domain':'mail.thewedmarket.com','permission':'sending_access','weddingMarketRestarted':True,'healthPassed':True,'credentialsPrinted':False,'otherAppsChanged':False,'providerDeliveryVerified':False}
        receipt=Path('/home/wm-audit-20261019/owner-mail-configuration-results.json');receipt.write_text(json.dumps(result,indent=2)+'\n');os.chmod(receipt,0o600);os.chown(receipt,int(subprocess.check_output(['id','-u','wm-audit-20261019'],text=True)),int(subprocess.check_output(['id','-g','wm-audit-20261019'],text=True)))
        print(json.dumps(result))

if __name__=='__main__':
    try: main()
    except Exception:
        print('Wedding Market mail configuration stopped. No credential was printed. Review the scoped owner helper.')
        raise SystemExit(1)
