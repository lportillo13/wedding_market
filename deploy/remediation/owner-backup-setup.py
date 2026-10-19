#!/usr/bin/env python3
"""Owner backup setup, optional hidden database connection, no new subscription."""
import argparse
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
from urllib.parse import unquote, urlparse
import urllib.request

PROJECT = 'aousexbvujjnvbudpsmz'
SOURCE = Path(__file__).resolve().parent
PRIVATE = Path('/etc/wedding-market-backups')
TOOLS = Path('/usr/local/lib/wedding-market-backups')
PHASE = 'preflight'


def database_config(uri):
    parsed = urlparse(uri)
    user = unquote(parsed.username or '')
    host = parsed.hostname or ''
    direct = host == 'db.' + PROJECT + '.supabase.co' and user == 'postgres'
    pooled = re.fullmatch(r'aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com', host) and user == 'postgres.' + PROJECT
    if parsed.scheme not in ('postgres', 'postgresql') or not (direct or pooled) or (parsed.port or 5432) != 5432 or parsed.path != '/postgres' or not parsed.password:
        raise ValueError('Expected this project direct/session connection on port 5432.')
    return {'host': host, 'port': 5432, 'user': user, 'password': unquote(parsed.password), 'database': 'postgres'}


def command(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def install_runtime():
    files = {
        'owner-backup.mjs': SOURCE / 'owner-backup.mjs',
        'backup-streams.mjs': SOURCE / 'backup-streams.mjs',
        'package.json': SOURCE / 'backup-runtime/package.json',
        'package-lock.json': SOURCE / 'backup-runtime/package-lock.json',
    }
    same_files = all((TOOLS / name).is_file() and hashlib.sha256((TOOLS / name).read_bytes()).digest()
                     == hashlib.sha256(source.read_bytes()).digest() for name, source in files.items())
    if same_files and all((TOOLS / ('node_modules/' + name + '/package.json')).is_file()
                          for name in ['@aws-sdk/client-s3', '@next/env']):
        print('Reusing the matching independent backup runtime.')
        return None
    # Install separately so a registry/network failure cannot break the active timer.
    staging = Path(tempfile.mkdtemp(prefix='.wm-backup-runtime-', dir=TOOLS.parent))
    for name, source in files.items():
        shutil.copyfile(source, staging / name)
        (staging / name).chmod(0o600)
    command(['/usr/bin/npm', 'ci', '--prefix', str(staging), '--omit=dev', '--ignore-scripts',
             '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'])
    previous = TOOLS.with_name(TOOLS.name + '.before-' + str(time.time_ns()))
    os.replace(TOOLS, previous)
    try:
        os.replace(staging, TOOLS)
    except Exception:
        os.replace(previous, TOOLS)
        raise
    return previous


def atomic_private_write(target, data):
    descriptor, temporary = tempfile.mkstemp(prefix='.wm-backup-config-', dir=target.parent)
    with os.fdopen(descriptor, 'wb') as output:
        output.write(data)
    os.replace(temporary, target)


def verify_first_backup(db, previous_runtime):
    global PHASE
    database_file = PRIVATE / 'database.json'
    if database_file.is_symlink(): raise ValueError('Unexpected database configuration symlink.')
    previous_database = database_file.read_bytes() if database_file.exists() else None
    try:
        if db: atomic_private_write(database_file, json.dumps(db).encode())
        PHASE = 'create and verify encrypted backup'
        subprocess.run(['/usr/bin/node', str(TOOLS / 'owner-backup.mjs')], check=True)
    except Exception:
        if db:
            if previous_database is None: database_file.unlink(missing_ok=True)
            else: atomic_private_write(database_file, previous_database)
        if previous_runtime:
            failed_runtime = TOOLS.with_name(TOOLS.name + '.failed-' + str(time.time_ns()))
            os.replace(TOOLS, failed_runtime)
            os.replace(previous_runtime, TOOLS)
        raise


def existing_connection():
    probe = """const {createRequire}=require('node:module');
const requireBackup=createRequire('/usr/local/lib/wedding-market-backups/package.json');
const names=['SUPABASE_DB_URL','DATABASE_URL','POSTGRES_URL','DIRECT_URL'];
for(const name of names) delete process.env[name];
const loaded=requireBackup('@next/env').loadEnvConfig('/var/www/wedding-market',false,{info(){},error(){}},true).parsedEnv??{};
const {execFileSync}=require('node:child_process');
const targets=JSON.parse(execFileSync('/usr/sbin/runuser',['-u','deploy','--','env','HOME=/home/deploy','PM2_HOME=/home/deploy/.pm2','/usr/bin/pm2','jlist'],{encoding:'utf8',stdio:['ignore','pipe','ignore']})).filter(x=>x.name==='wedding-market');
if(targets.length!==1)process.exit(1);
const named=targets[0].pm2_env;
console.log(JSON.stringify(names.map(name=>named[name]??named.env?.[name]??loaded[name]).filter(x=>typeof x==='string'&&x.length)));"""
    candidates = json.loads(subprocess.check_output(['/usr/bin/node', '-e', probe], stderr=subprocess.DEVNULL))
    for candidate in candidates:
        try: return database_config(candidate)
        except ValueError: pass
    return None


def main():
    global PHASE
    parser = argparse.ArgumentParser()
    parser.add_argument('--certificate', help='Downloaded public Supabase server root certificate, absolute path')
    parser.add_argument('--r2-only', action='store_true')
    parser.add_argument('--configured-connection', action='store_true', help='Use an existing same-project app connection; print no URI')
    parser.add_argument('--direct', action='store_true', help='Prompt for the raw database password on the known direct host')
    args = parser.parse_args()
    if os.geteuid() != 0 or (not args.r2_only and not os.isatty(0)):
        raise ValueError('Use the existing interactive root terminal.')
    os.umask(0o077)
    for directory in [PRIVATE, TOOLS]:
        if directory.is_symlink(): raise ValueError('Unexpected backup directory symlink.')
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        directory.chmod(0o700)
    db = None
    if not args.r2_only:
        certificate = Path(args.certificate or '')
        if not certificate.is_absolute() or not certificate.is_file() or 'BEGIN CERTIFICATE' not in certificate.read_text():
            raise ValueError('Download the project server root certificate before database setup.')
        if args.configured_connection:
            PHASE = 'discover existing same-project database connection'
            db = existing_connection()
            if not db:
                print('No existing same-project database connection was found. Recover the database password in Supabase before continuing.')
                raise ValueError('A database password is still needed.')
        elif args.direct:
            password = getpass.getpass('Paste the Wedding Market database password (hidden): ')
            if not password: raise ValueError('A database password is needed.')
            db = {'host': 'db.' + PROJECT + '.supabase.co', 'port': 5432, 'user': 'postgres', 'password': password, 'database': 'postgres'}
        else:
            db = database_config(getpass.getpass('Paste this project direct/session database URI (hidden): ').strip())
        system_ca = Path('/etc/ssl/certs/ca-certificates.crt').read_bytes()
        (PRIVATE / 'server-ca.crt').write_bytes(system_ca + b'\n' + certificate.read_bytes())
        (PRIVATE / 'server-ca.crt').chmod(0o600)
    # Ubuntu's signed package supplies the standard interoperable age format.
    PHASE = 'install signed Ubuntu encryption package'
    command(['apt-get', 'update', '-qq'])
    command(['apt-get', 'install', '-y', '--no-install-recommends', 'age', 'ca-certificates'])
    if db and not Path('/usr/lib/postgresql/17/bin/pg_dump').is_file():
        PHASE = 'install official PostgreSQL 17 client'
        key = Path('/usr/share/keyrings/wedding-market-pgdg.asc')
        with urllib.request.urlopen('https://www.postgresql.org/media/keys/ACCC4CF8.asc', timeout=20) as response:
            key.write_bytes(response.read(50000))
        key.chmod(0o644)
        # Repository is limited to client 17; no server daemon or meta-package.
        sources = Path('/etc/apt/sources.list.d/wedding-market-pgdg.sources')
        sources.write_text('Types: deb\nURIs: https://apt.postgresql.org/pub/repos/apt\nSuites: noble-pgdg\nComponents: main\nSigned-By: /usr/share/keyrings/wedding-market-pgdg.asc\n')
        sources.chmod(0o644)
        pin = Path('/etc/apt/preferences.d/wedding-market-pgdg')
        pin.write_text('Package: postgresql-client-17 postgresql-client-common libpq5\nPin: origin apt.postgresql.org\nPin-Priority: 500\n\nPackage: *\nPin: origin apt.postgresql.org\nPin-Priority: 100\n')
        pin.chmod(0o644)
        command(['apt-get', 'update', '-qq'])
        command(['apt-get', 'install', '-y', '--no-install-recommends', 'postgresql-client-17'])
    identity = PRIVATE / 'identity.txt'
    if not identity.exists(): command(['/usr/bin/age-keygen', '-o', str(identity)])
    identity.chmod(0o600)
    database_file = PRIVATE / 'database.json'
    if database_file.is_symlink(): raise ValueError('Unexpected database configuration symlink.')
    PHASE = 'install independent backup runtime'
    previous_runtime = install_runtime()
    verify_first_backup(db, previous_runtime)
    PHASE = 'enable daily backup timer'
    service = Path('/etc/systemd/system/wedding-market-backup.service')
    service.write_text('[Unit]\nDescription=Wedding Market encrypted backup\nAfter=network-online.target\nWants=network-online.target\n[Service]\nType=oneshot\nUMask=0077\nExecStart=/usr/bin/flock -n /run/lock/wedding-market-backup.lock /usr/bin/node /usr/local/lib/wedding-market-backups/owner-backup.mjs\nNice=15\nIOSchedulingClass=idle\nMemoryMax=512M\nCPUQuota=50%\nTimeoutStartSec=15min\nNoNewPrivileges=yes\nPrivateTmp=yes\nProtectSystem=full\n')
    service.chmod(0o644)
    timer = Path('/etc/systemd/system/wedding-market-backup.timer')
    timer.write_text('[Unit]\nDescription=Daily Wedding Market encrypted backup\n[Timer]\nOnCalendar=*-*-* 05:20:00 UTC\nRandomizedDelaySec=15min\nPersistent=true\n[Install]\nWantedBy=timers.target\n')
    timer.chmod(0o644)
    command(['systemctl', 'daemon-reload'])
    command(['systemctl', 'enable', '--now', 'wedding-market-backup.timer'])
    print('Backup verified; daily timer enabled. Securely copy the recovery identity off-host yourself. Do not paste it into chat.')
    print('This does not replace an isolated restore test or an off-host encrypted backup copy. No backup subscription was enabled.')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Backup setup stopped. Check the private configuration, supported clients, certificate and network. No credential was printed.')
        print('Step: ' + PHASE)
        raise SystemExit(1) from None
