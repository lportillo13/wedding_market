#!/usr/bin/env python3
"""Owner installs pinned recovery tools; runs one isolated bounded restore."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

def binding_health():
    config=json.loads(Path('/etc/wedding-market-backups/database.json').read_text())
    if config['host']!='db.aousexbvujjnvbudpsmz.supabase.co' or config['user']!='postgres' or config['port']!=5432: raise ValueError('Expected matching direct backup connection')
    env={'PATH':'/usr/bin:/bin','PGHOST':config['host'],'PGPORT':'5432','PGUSER':config['user'],'PGPASSWORD':config['password'],'PGDATABASE':'postgres','PGSSLMODE':'verify-full','PGSSLROOTCERT':'/etc/wedding-market-backups/server-ca.crt','PGCONNECT_TIMEOUT':'10','PGOPTIONS':'-c default_transaction_read_only=on -c statement_timeout=10000'}
    query="SELECT json_build_object('registered',count(*),'active',count(*) FILTER(WHERE t.is_active),'sessionAlive',count(*) FILTER(WHERE EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=t.auth_session_id AND s.user_id=t.user_id AND(s.not_after IS NULL OR s.not_after>now()))),'deliverable',(SELECT count(*) FROM public.active_message_push_bindings('3c794f88-bdb0-4df0-af48-4392bcd7411e'::uuid))) FROM public.user_push_tokens t WHERE t.user_id='3c794f88-bdb0-4df0-af48-4392bcd7411e'::uuid;"
    return json.loads(subprocess.check_output(['/usr/lib/postgresql/17/bin/psql','-X','-v','ON_ERROR_STOP=1','-At','-c',query],env=env,stderr=subprocess.DEVNULL,timeout=20))

STAGE=Path('/home/wm-audit-20261019/owner-backup-readiness-20261027')
TOOLS=Path('/usr/local/lib/wedding-market-restore17')
PACKAGE_SHA='d5b58058a82a3f344f832aea2cc54badc4f6265c25c960752cb1f5df5d2180ee'
WORKER_SHA='5ce9ed297f12db650167e3c3e2addecf89a88a3c5d0f364dc7450fd33277be9d'

def main():
    if os.geteuid()!=0: raise ValueError('Use owner root terminal')
    os.umask(0o077)
    try:health=binding_health()
    except Exception:health={'available':False,'readOnlyCheckFailed':True}
    package=STAGE/'restore-runtime/postgresql-17_17.11-1.pgdg24.04+2_amd64.deb'
    worker=STAGE/'isolated-restore-worker.py'
    for file,sha in [(package,PACKAGE_SHA),(worker,WORKER_SHA)]:
        if file.is_symlink() or hashlib.sha256(file.read_bytes()).hexdigest()!=sha: raise ValueError('Pinned tool differs')
    if TOOLS.exists():
        if TOOLS.is_symlink() or TOOLS.stat().st_uid!=0 or (TOOLS/'package.sha256').read_text().strip()!=PACKAGE_SHA:raise ValueError('Existing restore tools require review')
    else:
        TOOLS.mkdir(mode=0o755)
        subprocess.run(['dpkg-deb','--extract',str(package),str(TOOLS)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=30)
        (TOOLS/'package.sha256').write_text(PACKAGE_SHA+'\n')
    installed=TOOLS/'restore-worker.py';installed.write_bytes(worker.read_bytes());installed.chmod(0o644)
    receipt_path=Path('/home/wm-audit-20261019/owner-backup-results.json')
    receipt=json.loads(receipt_path.read_text())
    backup=Path(receipt['backupDirectory'])
    if backup.parent!=Path('/var/backups/wedding-market-data') or backup.is_symlink() or not receipt.get('databaseBackup') or not receipt.get('encryptedReadbackPassed'):raise ValueError('Verified backup required')
    identity='/etc/wedding-market-backups/identity.txt'
    manifest=json.loads(subprocess.check_output(['/usr/bin/age','-d','-i',identity,str(backup/'manifest.json.age')],stderr=subprocess.DEVNULL,timeout=20))
    if manifest.get('project')!='aousexbvujjnvbudpsmz' or manifest.get('bucket')!='the-wedding-market':raise ValueError('Backup scope mismatch')
    # Restore one owned disposable image into memory and check the stored digest.
    owned=[item for item in manifest['objects'] if item['key'].startswith('clients/8fb02e8f-abbc-418a-a91b-8b2f7913d7a6/avatar/')]
    if not owned: raise ValueError('Disposable restore image not found in backup')
    item=owned[-1]
    if '/' in item['file'] or item['bytes']>20*1024*1024:raise ValueError('Unexpected restore media')
    media=subprocess.check_output(['/usr/bin/age','-d','-i',identity,str(backup/item['file'])],stderr=subprocess.DEVNULL,timeout=20)
    if len(media)!=item['bytes'] or hashlib.sha256(media).hexdigest()!=item['sha256']:raise ValueError('Restored media digest differs')
    del media
    decrypt=subprocess.Popen(['/usr/bin/age','-d','-i',identity,str(backup/'database.dump.age')],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
    args=['systemd-run','--quiet','--wait','--pipe','--collect','--unit=wm-restore-acceptance','--property=DynamicUser=yes','--property=RuntimeDirectory=wm-restore-acceptance','--property=RuntimeDirectoryMode=0700','--property=PrivateNetwork=yes','--property=RestrictAddressFamilies=AF_UNIX','--property=ProtectSystem=strict','--property=ProtectHome=yes','--property=PrivateTmp=yes','--property=PrivateDevices=yes','--property=NoNewPrivileges=yes','--property=MemoryMax=384M','--property=CPUQuota=30%','--property=TasksMax=48','--property=RuntimeMaxSec=300','--property=TimeoutStopSec=15','/usr/bin/python3',str(installed)]
    try:
        run=subprocess.run(args,stdin=decrypt.stdout,capture_output=True,timeout=330)
        decrypt.stdout.close();decrypt.wait(timeout=10)
        lines=run.stdout.decode(errors='replace').splitlines()
        outcome=next((json.loads(line) for line in reversed(lines) if line.startswith('{')),{'applicationDumpRestored':False,'phase':'isolated unit startup'})
        if run.returncode or decrypt.returncode or not outcome.get('applicationDumpRestored'):
            print(json.dumps(outcome));raise ValueError('Isolated restore failed')
    finally:
        if decrypt.poll() is None: decrypt.kill();decrypt.wait(timeout=10)
        subprocess.run(['systemctl','stop','wm-restore-acceptance.service'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=20)
    result={'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'backupCompletedAt':receipt['completedAt'],'scope':'Wedding Market application dump: public, auth, supabase_migrations plus one owned test image','applicationDumpRestored':True,'mediaObjectRestoredAndHashVerified':True,'transientDatabaseStopped':True,'plaintextRuntimeRemoved':not Path('/run/wm-restore-acceptance').exists(),'memoryLimitBytes':384*1024*1024,'cpuQuotaPercent':30,'systemPostgresServiceInstalled':False,'controlledDeviceBindingHealth':health,**outcome}
    path=Path('/home/wm-audit-20261019/owner-restore-results.json');path.write_text(json.dumps(result,indent=2)+'\n');path.chmod(0o600);os.chown(path,int(subprocess.check_output(['id','-u','wm-audit-20261019'],text=True)),int(subprocess.check_output(['id','-g','wm-audit-20261019'],text=True)))
    print(json.dumps(result))
    # The earlier owner-approved retention installer performs only its dry run.
    installer=Path('/var/www/wedding-market/deploy/maintenance/install-release-retention.sh')
    if installer.is_symlink() or hashlib.sha256(installer.read_bytes()).hexdigest()!='1a0d89e743bce54315079a22bac7a170baf4d9eeab2a3dc2e4b9145ad490e715':raise ValueError('Reviewed retention installer differs')
    subprocess.run(['/usr/bin/bash',str(installer)],check=True,timeout=120)

if __name__=='__main__':
    try:main()
    except Exception:
        print('Isolated recovery check stopped; no production database was changed and no credential was printed.')
        raise SystemExit(1)
