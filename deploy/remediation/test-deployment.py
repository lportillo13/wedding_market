#!/usr/bin/env python3
"""Synthetic Linux regression checks; no real PM2, network or production files."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('wm_deploy', Path(__file__).with_name('owner-deploy.py'))
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)


def rejected(callback):
    try:
        callback()
    except (RuntimeError, FileNotFoundError):
        return
    raise AssertionError('Expected the deployment guard to reject this input.')


with tempfile.TemporaryDirectory(prefix='wm-release-tests-') as folder:
    root = Path(folder)
    releases = root / 'releases'
    releases.mkdir()
    original = root / 'original'
    (original / '.git').mkdir(parents=True)
    assert deployment.checked_app_directory(original, releases) == original
    stage = releases / 'reviewed-release'
    (stage / '.git').mkdir(parents=True)
    app = root / 'app'
    app.symlink_to(stage, target_is_directory=True)
    assert deployment.checked_app_directory(app, releases) == stage
    app.unlink()
    app.symlink_to(original, target_is_directory=True)
    rejected(lambda: deployment.checked_app_directory(app, releases))
    app.unlink()
    alias = root / 'releases-alias'
    alias.symlink_to(releases, target_is_directory=True)
    app.symlink_to(stage, target_is_directory=True)
    rejected(lambda: deployment.checked_app_directory(app, alias))
    rejected(lambda: deployment.checked_app_directory(root / 'missing', releases))


def fake_http(path, port=3001, method='GET'):
    if path == '/api/health': return 200, {}, b'{}'
    if path == '/':
        return 200, {'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY'}, b'<header class="wm-site-header wm-mobile-navigation">'
    if path.startswith('/api/vendors?'): return 200, {}, json.dumps({'items': []}).encode()
    return 401, {}, b''


with patch.object(deployment, 'http', side_effect=fake_http):
    results = deployment.probes(3012, ['wm-site-header', 'wm-mobile-navigation'])
    assert results['/api/mobile/quotes'] == 401
    assert results['/api/mobile/push-token'] == 401
    rejected(lambda: deployment.probes(3012, ['absent-release-marker']))

with patch.object(deployment, 'http', return_value=(200, {}, b'')):
    rejected(lambda: deployment.probes(3012))

print('PASS: original/managed checkouts, escaped/symlinked/missing release rejection, new markup, security headers and native API authorization checks.')


with tempfile.TemporaryDirectory(prefix='wm-release-git-tests-') as folder:
    root = Path(folder)
    source, production, stage = (root / name for name in ['source', 'production', 'stage'])
    source.mkdir()
    git_env = dict(os.environ, GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null',
                   GIT_AUTHOR_NAME='Synthetic test', GIT_AUTHOR_EMAIL='synthetic@example.invalid',
                   GIT_COMMITTER_NAME='Synthetic test', GIT_COMMITTER_EMAIL='synthetic@example.invalid')

    def git(*args, cwd=source):
        return subprocess.check_output(['git', *args], cwd=cwd, env=git_env, stderr=subprocess.DEVNULL).decode().strip()

    git('init', '-b', 'codex/audit-remediation')
    (source / 'synthetic.txt').write_text('baseline')
    git('add', 'synthetic.txt')
    git('commit', '-m', 'Synthetic baseline')
    base = git('rev-parse', 'HEAD')
    git('clone', '--no-hardlinks', str(source), str(production))
    (source / 'synthetic.txt').write_text('release')
    git('commit', '-am', 'Synthetic release')
    commit = git('rev-parse', 'HEAD')
    bundle = root / 'release.bundle'
    git('bundle', 'create', str(bundle), 'codex/audit-remediation', '^' + base)
    git('clone', '--no-hardlinks', '--no-checkout', str(production), str(stage))
    git('fetch', str(bundle), 'refs/heads/codex/audit-remediation', cwd=stage)
    broken = subprocess.run(['git', 'checkout', '-b', 'codex/audit-remediation', 'FETCH_HEAD'],
                            cwd=stage, env=git_env, capture_output=True)
    assert broken.returncode != 0 and b'already exists' in broken.stderr

    def run_as_test_owner(args, *, cwd=None, env=None, as_deploy=False, log=None):
        return subprocess.check_output(args, cwd=cwd, env=git_env, stderr=subprocess.DEVNULL).decode().rstrip('\n')

    with patch.object(deployment, 'run', side_effect=run_as_test_owner):
        deployment.checkout_release(stage, bundle, commit, git_env, root / 'build.log')
    assert git('rev-parse', 'HEAD', cwd=stage) == commit
    assert git('branch', '--show-current', cwd=stage) == 'codex/audit-remediation'
    assert (stage / 'synthetic.txt').read_text() == 'release'
    assert git('rev-parse', 'HEAD', cwd=production) == base
    assert (production / 'synthetic.txt').read_text() == 'baseline'

print('PASS: an incremental release replaces the existing branch only in the new clone and leaves production source unchanged.')
