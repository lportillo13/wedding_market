#!/usr/bin/env python3
"""Owner-run deployment. No secret values or customer rows are printed.

Builds and probes a separate release, preserves the complete current checkout,
then replaces only Wedding Market's PM2 process. Other applications are untouched.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import signal
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

APP = Path('/var/www/wedding-market')
ARTIFACTS = Path(__file__).resolve().parent
AUDIT_HOME = Path('/home/wm-audit-20261019')
EXPECTED_BASE = '07f4f489c108fc850d6f7c22292d3a328c3fe747'
PROJECT = 'aousexbvujjnvbudpsmz'
RESULT = AUDIT_HOME / 'owner-deploy-results.json'
DEPLOY = pwd.getpwnam('deploy') if os.geteuid() == 0 else None


def digest(path):
    return hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()


def private_write(path, data, uid=0, gid=0):
    descriptor, temporary = tempfile.mkstemp(prefix='.wm-private-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
            output.write(data)
            os.fchmod(output.fileno(), 0o600)
            os.fchown(output.fileno(), uid, gid)
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def run(args, *, cwd=None, env=None, as_deploy=True, log=None, input_data=None):
    options = {'cwd': cwd, 'env': env}
    if as_deploy:
        options.update(user=DEPLOY.pw_uid, group=DEPLOY.pw_gid, extra_groups=[])
    if log:
        with log.open('ab') as output:
            subprocess.run(args, input=input_data, stdout=output, stderr=subprocess.STDOUT, check=True, **options)
        return ''
    return subprocess.check_output(args, input=input_data, stderr=subprocess.DEVNULL, **options).decode().rstrip('\n')


def deploy_write(path, data):
    """Never perform privileged writes through deploy-controlled directories."""
    source = '''import os,sys,tempfile
from pathlib import Path
path=Path(sys.argv[1])
descriptor,temporary=tempfile.mkstemp(prefix='.wm-private-',dir=path.parent)
try:
    with os.fdopen(descriptor,'wb') as output:
        os.fchmod(output.fileno(),0o600)
        output.write(sys.stdin.buffer.read())
    os.replace(temporary,path)
finally:
    Path(temporary).unlink(missing_ok=True)
'''
    run(['/usr/bin/python3', '-I', '-c', source, str(path)], as_deploy=True,
        input_data=data.encode() if isinstance(data, str) else data)


def http(path, port=3001, method='GET'):
    request = urllib.request.Request('http://127.0.0.1:%s%s' % (port, path), method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return response.status, {key.lower(): value for key, value in response.headers.items()}, response.read()
    except urllib.error.HTTPError as error:
        return error.code, {key.lower(): value for key, value in error.headers.items()}, b''


def probes(port, required_markup=()):
    for _ in range(30):
        try:
            if http('/api/health', port)[0] == 200:
                break
        except (OSError, urllib.error.URLError):
            pass
        time.sleep(1)
    checks = {}
    for path, expected, method in [
        ('/api/health', 200, 'GET'), ('/', 200, 'GET'),
        ('/api/vendors?pageSize=1', 200, 'GET'),
        ('/api/uploads', 401, 'POST'), ('/api/ready', 401, 'GET'),
        ('/api/admin/blog-posts', 401, 'GET'),
        ('/api/mobile/quotes', 401, 'POST'),
        ('/api/mobile/quote-replies', 401, 'POST'),
        ('/api/mobile/quotes/accept', 401, 'POST'),
        ('/api/mobile/push-token', 401, 'POST'),
    ]:
        status, headers, body = http(path, port, method)
        if status != expected:
            raise RuntimeError('Application smoke check failed: ' + path)
        if path == '/':
            if headers.get('x-content-type-options') != 'nosniff' or headers.get('x-frame-options') != 'DENY':
                raise RuntimeError('Expected security headers are missing.')
            if any(marker.encode() not in body for marker in required_markup):
                raise RuntimeError('Expected release markup is missing.')
        if path.startswith('/api/vendors'):
            data = json.loads(body)
            if len(data.get('items', [])) > 1 or 'error' in data:
                raise RuntimeError('Bounded directory check failed.')
        checks[path] = status
    return checks


def checked_app_directory(app, release_parent):
    """Accept the original checkout or a direct child of the managed releases."""
    if app.is_symlink():
        resolved = app.resolve(strict=True)
        if release_parent.is_symlink() or resolved.parent != release_parent.resolve(strict=True):
            raise RuntimeError('The application symlink is outside the managed release directory.')
    else:
        resolved = app
    if not resolved.is_dir() or not (resolved / '.git').is_dir():
        raise RuntimeError('The managed application checkout is missing.')
    return resolved


def checkout_release(stage, bundle, commit, env, build_log):
    run(['git', 'fetch', str(bundle), 'refs/heads/codex/audit-remediation'], cwd=stage, env=env, as_deploy=True, log=build_log)
    # Only the new, isolated clone is reset; production keeps running unchanged.
    run(['git', 'checkout', '-B', 'codex/audit-remediation', 'FETCH_HEAD'], cwd=stage, env=env, as_deploy=True, log=build_log)
    if run(['git', 'rev-parse', 'HEAD'], cwd=stage, as_deploy=True) != commit:
        raise RuntimeError('Fetched release identity mismatch.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--manifest-sha', required=True)
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise RuntimeError('Run this reviewed script from the existing root terminal.')
    manifest_path = ARTIFACTS / 'release-manifest.json'
    if not re.fullmatch(r'[a-f0-9]{64}', args.manifest_sha) or digest(manifest_path) != args.manifest_sha:
        raise RuntimeError('Release manifest checksum mismatch.')
    manifest = json.loads(manifest_path.read_text())
    if not re.fullmatch(r'[a-f0-9]{40}', manifest['commit']):
        raise RuntimeError('Invalid release identity.')
    for name, expected in manifest.get('toolHashes', {}).items():
        if name not in ('owner-deploy.py', 'owner-origin-hardening.py') or digest(ARTIFACTS / name) != expected:
            raise RuntimeError('Reviewed deployment tool checksum mismatch.')
    bundle = ARTIFACTS / 'wedding-market-remediation.bundle'
    if digest(bundle) != manifest['bundleSha256']:
        raise RuntimeError('Release bundle checksum mismatch.')
    release_parent = Path('/var/www/wedding-market-releases')
    current_release = checked_app_directory(APP, release_parent)
    expected_base = manifest.get('expectedBaseCommit', EXPECTED_BASE)
    if not re.fullmatch(r'[a-f0-9]{40}', expected_base):
        raise RuntimeError('Invalid expected production commit.')
    if run(['git', '-C', str(APP), 'rev-parse', 'HEAD'], as_deploy=True) != expected_base:
        raise RuntimeError('The deployed source changed since the audit. Recheck before deploying.')
    required_markup = manifest.get('requiredPublicMarkup', [])
    if not isinstance(required_markup, list) or any(
        not isinstance(marker, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}', marker)
        for marker in required_markup
    ):
        raise RuntimeError('Invalid public release markers.')
    status = run(['git', '-C', str(APP), 'status', '--porcelain'], as_deploy=True)
    allowed = set(manifest['preservedProductionPatchFiles'])
    if any(line[3:] not in allowed for line in status.splitlines()):
        raise RuntimeError('Unexpected server worktree changes need review before deployment.')
    if set(manifest.get('preservedProductionHashes', {})) != allowed:
        raise RuntimeError('The preserved production patch manifest is incomplete.')
    for name, expected in manifest['preservedProductionHashes'].items():
        if digest(APP / name) != expected:
            raise RuntimeError('A production patch changed since its reviewed import; recheck before deploying.')
    if shutil.disk_usage('/var/www').free < 6 * 1024**3:
        raise RuntimeError('Insufficient disk space for a separate build and rollback copy.')
    memory = {line.split(':')[0]: int(line.split()[1]) for line in Path('/proc/meminfo').read_text().splitlines()}
    if memory.get('MemAvailable', 0) < 3 * 1024**2:
        raise RuntimeError('Insufficient available memory for a safe parallel build.')
    deploy_env = dict(os.environ, HOME='/home/deploy', USER='deploy', LOGNAME='deploy', PM2_HOME='/home/deploy/.pm2')
    processes = json.loads(run(['pm2', 'jlist'], env=deploy_env, as_deploy=True))
    targets = [item for item in processes if item['name'] == 'wedding-market']
    allowed_cwds = {str(APP), str(APP / '.next/standalone'), str(current_release / '.next/standalone')}
    if len(targets) != 1 or targets[0]['pm2_env']['pm_cwd'] not in allowed_cwds:
        raise RuntimeError('The audited Wedding Market PM2 configuration changed.')
    current = targets[0]['pm2_env']
    recorded_release = current.get('WM_RELEASE_COMMIT') or current.get('env', {}).get('WM_RELEASE_COMMIT')
    if recorded_release and recorded_release != expected_base:
        raise RuntimeError('The running process and expected source revision disagree.')
    node = str(Path('/proc/%s/exe' % targets[0]['pid']).resolve())
    major = int(run([node, '-p', 'process.versions.node.split(".")[0]'], as_deploy=True))
    if major not in (22, 24):
        raise RuntimeError('Use the supported production Node runtime.')
    stamp = time.strftime('%Y%m%d-%H%M%S', time.gmtime())
    private = Path('/var/backups/wedding-market-deploy') / stamp
    private.mkdir(parents=True, mode=0o700)
    private.chmod(0o700)
    if release_parent.is_symlink():
        raise RuntimeError('Unexpected symlink for the release parent.')
    release_parent.mkdir(exist_ok=True, mode=0o755)
    release_parent.chmod(0o755)
    stage = release_parent / (stamp + '-' + manifest['commit'][:12])
    stage.mkdir(mode=0o700)
    os.chown(stage, DEPLOY.pw_uid, DEPLOY.pw_gid)
    build_log = private / 'build.log'
    original_origin = run(['git', '-C', str(APP), 'remote', 'get-url', 'origin'], as_deploy=True)
    old_backup = APP.with_name('wedding-market.before-' + stamp)
    env = {str(k): str(v) for k, v in current.get('env', {}).items() if isinstance(v, (str, int, float))}
    old_env = dict(env)
    env.update(HOME='/home/deploy', USER='deploy', LOGNAME='deploy', PM2_HOME='/home/deploy/.pm2',
               NODE_ENV='production', NEXT_TELEMETRY_DISABLED='1', NODE_OPTIONS='--max-old-space-size=2048')
    env['PATH'] = str(Path(node).parent) + ':' + env.get('PATH', os.environ['PATH'])
    old_config = {'apps': [{'name': 'wedding-market', 'script': current['pm_exec_path'],
                           'cwd': current['pm_cwd'], 'args': current.get('args', []),
                           'interpreter': current.get('exec_interpreter', node), 'env': old_env}]}
    private_write(private / 'rollback.json', json.dumps(old_config))
    # PM2 runs as deploy, so its temporary config is private to that existing owner.
    runtime_parent = Path('/home/deploy/.wm-remediation-runtime')
    if runtime_parent.is_symlink():
        raise RuntimeError('Unexpected symlink for the runtime configuration parent.')
    run(['/usr/bin/install', '-d', '-m', '700', str(runtime_parent)], as_deploy=True)
    config_dir = runtime_parent / stamp
    run(['/usr/bin/install', '-d', '-m', '700', str(config_dir)], as_deploy=True)
    deploy_bundle = config_dir / 'release.bundle'
    deploy_write(deploy_bundle, bundle.read_bytes())
    if digest(deploy_bundle) != manifest['bundleSha256']:
        raise RuntimeError('Copied release bundle checksum mismatch.')
    runtime_config = config_dir / 'runtime.json'
    switched = False
    shadow = None
    summary = {'releaseCommit': manifest['commit'], 'applicationDeployed': False, 'rollbackCopy': str(old_backup)}
    try:
        summary['step'] = 'clone reviewed source'
        print('Building a separate Wedding Market release; the current application remains running.', flush=True)
        run(['git', 'clone', '--no-hardlinks', '--no-checkout', str(APP), str(stage)], env=env, as_deploy=True, log=build_log)
        configure_origin = """import configparser,os,sys
c=configparser.RawConfigParser();c.read('.git/config')
c.set('remote "origin"','url',sys.stdin.read())
with open('.git/config','w') as output:c.write(output)
os.chmod('.git/config',0o600)
"""
        run(['python3', '-c', configure_origin], cwd=stage, env=env, as_deploy=True, input_data=original_origin.encode())
        checkout_release(stage, deploy_bundle, manifest['commit'], env, build_log)
        # Read deploy-controlled source files with deploy's existing permissions.
        original_env = run(['cat', str(APP / '.env.production.local')], as_deploy=True)
        if PROJECT not in original_env and PROJECT not in env.get('NEXT_PUBLIC_SUPABASE_URL', ''):
            raise RuntimeError('Production environment does not identify the audited Supabase project.')
        overrides = {}
        if manifest.get('mediaDomainReady'):
            legacy = 'https://pub-ba9d061e45fd4674ac2582db21b2512c.r2.dev'
            overrides.update(R2_PUBLIC_BASE_URL='https://media.thewedmarket.com', NEXT_PUBLIC_R2_PUBLIC_BASE_URL='https://media.thewedmarket.com',
                             R2_LEGACY_PUBLIC_BASE_URL=legacy, NEXT_PUBLIC_R2_LEGACY_PUBLIC_BASE_URL=legacy)
        env.update(overrides)
        new_env = original_env + ('\n# Reviewed remediation overrides\n' + ''.join('%s=%s\n' % item for item in overrides.items()) if overrides else '')
        deploy_write(stage / '.env.production.local', new_env)
        summary['step'] = 'install build dependencies'
        run(['nice', '-n', '10', 'npm', 'ci', '--include=dev', '--no-fund', '--no-audit'], cwd=stage, env=env, as_deploy=True, log=build_log)
        summary['step'] = 'build production application'
        run(['nice', '-n', '10', 'npm', 'run', 'build'], cwd=stage, env=env, as_deploy=True, log=build_log)
        standalone = stage / '.next/standalone'
        if not (standalone / 'server.js').is_file():
            raise RuntimeError('Standalone server output is missing.')
        run(['mkdir', '-p', str(standalone / 'public'), str(standalone / '.next/static')], as_deploy=True)
        run(['cp', '-a', str(stage / 'public') + '/.', str(standalone / 'public')], as_deploy=True)
        run(['cp', '-a', str(stage / '.next/static') + '/.', str(standalone / '.next/static')], as_deploy=True)
        deploy_write(standalone / '.env.production.local', new_env)
        with socket.socket() as check:
            check.bind(('127.0.0.1', 3012))
        with (private / 'shadow.log').open('wb') as output:
            shadow = subprocess.Popen([node, 'server.js'], cwd=standalone,
                                      env=dict(env, PORT='3012', HOSTNAME='127.0.0.1'),
                                      user=DEPLOY.pw_uid, group=DEPLOY.pw_gid, extra_groups=[],
                                      stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
        summary['step'] = 'probe isolated application'
        summary['shadowChecks'] = probes(3012, required_markup)
        if shadow.poll() is not None:
            raise RuntimeError('Shadow application process exited unexpectedly.')
        os.killpg(shadow.pid, signal.SIGTERM)
        shadow.wait(timeout=10)
        shadow = None
        new_config = {'apps': [{'name': 'wedding-market', 'script': str(APP / '.next/standalone/server.js'),
                               'cwd': str(APP / '.next/standalone'), 'interpreter': node,
                               'env': dict(env, PORT='3001', HOSTNAME='127.0.0.1', WM_RELEASE_COMMIT=manifest['commit']),
                               'max_memory_restart': '1500M', 'restart_delay': 3000, 'kill_timeout': 5000}]}
        deploy_write(runtime_config, json.dumps(new_config))
        summary['step'] = 'switch Wedding Market process'
        APP.rename(old_backup)
        APP.symlink_to(stage, target_is_directory=True)
        switched = True
        run(['pm2', 'delete', 'wedding-market'], env=deploy_env, as_deploy=True, log=build_log)
        run(['pm2', 'start', str(runtime_config), '--only', 'wedding-market'], env=deploy_env, as_deploy=True, log=build_log)
        summary['liveChecks'] = probes(3001, required_markup)
        run(['pm2', 'save', '--force'], env=deploy_env, as_deploy=True, log=build_log)
        dump = Path('/home/deploy/.pm2/dump.pm2')
        if dump.exists(): run(['/usr/bin/chmod', '600', str(dump)], as_deploy=True)
        summary['applicationDeployed'] = True
        summary['step'] = 'complete'
        print('Wedding Market deployed and probed. The full prior checkout is preserved for rollback.', flush=True)
        print('The historical deploy-wm.sh was not changed; review it before any future deployment.', flush=True)
    except Exception as error:
        if shadow is not None:
            try: os.killpg(shadow.pid, signal.SIGKILL)
            except ProcessLookupError: pass
        if switched:
            try:
                run(['pm2', 'delete', 'wedding-market'], env=deploy_env, as_deploy=True, log=build_log)
            except subprocess.CalledProcessError:
                pass
            if not APP.is_symlink(): raise RuntimeError('Unexpected app path during rollback; owner intervention required.')
            APP.unlink()
            old_backup.rename(APP)
            rollback = config_dir / 'rollback.json'
            deploy_write(rollback, json.dumps(old_config))
            run(['pm2', 'start', str(rollback), '--only', 'wedding-market'], env=deploy_env, as_deploy=True, log=build_log)
            run(['pm2', 'save', '--force'], env=deploy_env, as_deploy=True, log=build_log)
            summary['rolledBack'] = True
        summary['error'] = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        summary['privateLogDirectory'] = str(private)
        raise
    finally:
        audit = pwd.getpwnam('wm-audit-20261019')
        private_write(RESULT, json.dumps(summary, indent=2) + '\n', audit.pw_uid, audit.pw_gid)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print subprocess args, environment, logs, or exception payloads.
        print('Deployment stopped safely. Review the owner-only log and sanitized result file.', flush=True)
        if isinstance(error, RuntimeError): print(str(error), flush=True)
        raise SystemExit(1) from None
