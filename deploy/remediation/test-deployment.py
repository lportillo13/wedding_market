#!/usr/bin/env python3
"""Synthetic Linux regression checks; no real PM2, network or production files."""
import importlib.util
import json
from pathlib import Path
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
