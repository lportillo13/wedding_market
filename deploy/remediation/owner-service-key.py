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
import tempfile

APP = Path('/var/www/wedding-market')
PROJECT = 'aousexbvujjnvbudpsmz'
STEP = 'preflight'
PROBE_STATUS = None


def write_result(data):
    audit = pwd.getpwnam('wm-audit-20261019')
    result = Path('/home/wm-audit-20261019/owner-service-key-results.json')
    descriptor, temporary = tempfile.mkstemp(prefix='.wm-key-result-', dir=result.parent)
    with os.fdopen(descriptor, 'w') as output:
        output.write(json.dumps(data) + '\n')
        os.fchown(output.fileno(), audit.pw_uid, audit.pw_gid)
    os.replace(temporary, result)


def valid_privileged_format(key):
    if re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{20,}', key):
        return True
    if not re.fullmatch(r'[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', key):
        return False
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
    global STEP, PROBE_STATUS
    if os.geteuid() != 0 or not os.isatty(0):
        raise ValueError('Use the existing interactive root terminal.')
    deploy = pwd.getpwnam('deploy')
    env = dict(PATH=os.environ['PATH'], HOME='/home/deploy', USER='deploy', LOGNAME='deploy', PM2_HOME='/home/deploy/.pm2')
    def run(args, child_env=None):
        return subprocess.check_output(args, env=child_env or env, user=deploy.pw_uid, group=deploy.pw_gid, extra_groups=[], stderr=subprocess.DEVNULL, cwd=APP)
    STEP = 'check deployed Wedding Market process'
    processes = json.loads(run(['pm2', 'jlist']))
    selected = [p for p in processes if p['name'] == 'wedding-market']
    if len(selected) != 1 or not (selected[0]['pm2_env'].get('WM_RELEASE_COMMIT') or selected[0]['pm2_env'].get('env', {}).get('WM_RELEASE_COMMIT')):
        raise ValueError('Deploy and verify the reviewed application first.')
    current = selected[0]
    node = str(Path('/proc/%s/exe' % current['pid']).resolve())
    STEP = 'validate privileged key format and project'
    key = getpass.getpass('Paste the Wedding Market Supabase service key (hidden): ').strip()
    if not valid_privileged_format(key):
        raise ValueError('Expected a privileged key for the audited project.')
    child = {str(k): str(v) for k, v in current['pm2_env'].get('env', {}).items() if isinstance(v, (str, int, float))}
    child.update(env, SUPABASE_SERVICE_ROLE_KEY=key, WM_PROBE_URL='https://' + PROJECT + '.supabase.co')
    # SDK probe returns only a status flag and uses a HEAD request with zero records.
    STEP = 'probe privileged key without reading records'
    probe = """const {createClient}=require('@supabase/supabase-js');
const c=createClient(process.env.WM_PROBE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
c.from('profiles').select('id',{head:true}).limit(0).abortSignal(AbortSignal.timeout(8000))
.then(({error,status})=>console.log(JSON.stringify({ok:!error,status})))
.catch(()=>console.log(JSON.stringify({ok:false,status:0})));"""
    probe_result = json.loads(run([node, '-e', probe], child_env=child))
    PROBE_STATUS = probe_result.get('status')
    if probe_result.get('ok') is not True:
        raise ValueError('The privileged key probe failed.')
    STEP = 'write Wedding Market environment files'
    for target in [APP / '.env.production.local', APP / '.next/standalone/.env.production.local']:
        if not target.is_file() or target.is_symlink():
            raise ValueError('Unexpected environment file layout.')
    for target in [APP / '.env.production.local', APP / '.next/standalone/.env.production.local']:
        text = replace_key(target.read_text(), key)
        descriptor, temporary = tempfile.mkstemp(prefix='.wm-credential-', dir=target.parent)
        with os.fdopen(descriptor, 'w') as output:
            output.write(text)
            os.fchown(output.fileno(), deploy.pw_uid, deploy.pw_gid)
        os.replace(temporary, target)
    child.pop('WM_PROBE_URL', None)
    STEP = 'restart only Wedding Market and save PM2'
    run(['pm2', 'restart', 'wedding-market', '--update-env'], child_env=child)
    run(['pm2', 'save', '--force'])
    Path('/home/deploy/.pm2/dump.pm2').chmod(0o600)
    write_result({'project': PROJECT, 'serviceCredentialProbePassed': True, 'probeHttpStatus': PROBE_STATUS, 'weddingMarketRestarted': True})
    print('Credential probe passed; only Wedding Market was restarted. No credential was printed.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('Credential update stopped. Check the project/key and the current application; no key was printed.')
        print('Step: ' + STEP)
        if os.geteuid() == 0:
            write_result({'serviceCredentialProbePassed': False, 'step': STEP, 'probeHttpStatus': PROBE_STATUS, 'errorType': type(error).__name__})
        raise SystemExit(1) from None
