#!/usr/bin/env python3
"""Owner-only hidden credential prompt; run after the application deployment."""
import base64
import getpass
import json
import os
from pathlib import Path
import pwd
import re
import subprocess

APP = Path('/var/www/wedding-market')
PROJECT = 'aousexbvujjnvbudpsmz'


def valid_privileged_format(key):
    if re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{20,}', key):
        return True
    try:
        payload = key.split('.')[1]
        data = json.loads(base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4)))
        return data.get('role') == 'service_role' and data.get('ref') == PROJECT
    except Exception:
        return False


def replace_key(text, key):
    # Remove every old definition of the selected key, including exported definitions.
    lines = [line for line in text.splitlines() if not re.match(r'^\s*(?:export\s+)?SUPABASE_SERVICE_ROLE_KEY\s*=', line)]
    return '\n'.join(lines) + '\nSUPABASE_SERVICE_ROLE_KEY=' + key + '\n'


def main():
    if os.geteuid() != 0 or not os.isatty(0):
        raise ValueError('Use the existing interactive root terminal.')
    deploy = pwd.getpwnam('deploy')
    env = dict(PATH=os.environ['PATH'], HOME='/home/deploy', USER='deploy', LOGNAME='deploy', PM2_HOME='/home/deploy/.pm2')
    def run(args, child_env=None):
        return subprocess.check_output(args, env=child_env or env, user=deploy.pw_uid, group=deploy.pw_gid, extra_groups=[], stderr=subprocess.DEVNULL, cwd=APP)
    processes = json.loads(run(['pm2', 'jlist']))
    selected = [p for p in processes if p['name'] == 'wedding-market']
    if len(selected) != 1 or not selected[0]['pm2_env'].get('WM_RELEASE_COMMIT'):
        raise ValueError('Deploy and verify the reviewed application first.')
    current = selected[0]
    node = str(Path('/proc/%s/exe' % current['pid']).resolve())
    key = getpass.getpass('Paste the Wedding Market Supabase service key (hidden): ').strip()
    if not valid_privileged_format(key):
        raise ValueError('Expected a privileged key for the audited project.')
    child = {str(k): str(v) for k, v in current['pm2_env'].get('env', {}).items() if isinstance(v, (str, int, float))}
    child.update(env, SUPABASE_SERVICE_ROLE_KEY=key, WM_PROBE_URL='https://' + PROJECT + '.supabase.co')
    # SDK probe returns only a status flag and uses a HEAD request with zero records.
    probe = """const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.WM_PROBE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
c.from('profiles').select('id',{head:true}).limit(0).abortSignal(AbortSignal.timeout(8000))
.then(({error})=>process.exit(error?1:0)).catch(()=>process.exit(1));"""
    run([node, '-e', probe], child_env=child)
    for target in [APP / '.env.production.local', APP / '.next/standalone/.env.production.local']:
        if not target.is_file() or target.is_symlink():
            raise ValueError('Unexpected environment file layout.')
    for target in [APP / '.env.production.local', APP / '.next/standalone/.env.production.local']:
        text = replace_key(target.read_text(), key)
        temporary = target.with_name(target.name + '.credential-update')
        temporary.touch(mode=0o600, exist_ok=False)
        temporary.write_text(text)
        os.chown(temporary, deploy.pw_uid, deploy.pw_gid)
        temporary.replace(target)
    child.pop('WM_PROBE_URL', None)
    run(['pm2', 'restart', 'wedding-market', '--update-env'], child_env=child)
    run(['pm2', 'save', '--force'])
    Path('/home/deploy/.pm2/dump.pm2').chmod(0o600)
    audit = pwd.getpwnam('wm-audit-20261019')
    result = Path('/home/wm-audit-20261019/owner-service-key-results.json')
    result.write_text(json.dumps({'project': PROJECT, 'serviceCredentialProbePassed': True, 'weddingMarketRestarted': True}) + '\n')
    os.chown(result, audit.pw_uid, audit.pw_gid)
    result.chmod(0o600)
    print('Credential probe passed; only Wedding Market was restarted. No credential was printed.')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Credential update stopped. Check the project/key and the current application; no key was printed.')
        raise SystemExit(1) from None
