#!/usr/bin/env python3
"""Synthetic Linux checks for the fixed deployment entry point; no root needed."""
import contextlib
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('wm_gateway', Path(__file__).with_name('deployment-gateway.py'))
gateway = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gateway)


def rejected(callback):
    try:
        callback()
    except (ValueError, OSError):
        return
    raise AssertionError('Expected a rejected deployment request.')


def manifest(helper_sha, bundle_sha):
    return {'commit': 'a' * 40, 'expectedBaseCommit': 'b' * 40, 'bundleSha256': bundle_sha,
            'preservedProductionPatchFiles': [], 'preservedProductionHashes': {},
            'mediaDomainReady': False, 'requiredPublicMarkup': ['wm-site-header'],
            'toolHashes': {'owner-deploy.py': helper_sha}}


valid = manifest('c' * 64, 'd' * 64)
gateway.validate_manifest(valid, 'c' * 64)
for field, value in [
    ('commit', '../../etc/shadow'), ('expectedBaseCommit', '--help'),
    ('preservedProductionPatchFiles', ['/etc/shadow']), ('preservedProductionHashes', {'../x': 'a'}),
    ('mediaDomainReady', True), ('toolHashes', {'owner-deploy.py': 'e' * 64}),
    ('requiredPublicMarkup', ['../../private']), ('bundleSha256', 'invalid'),
]:
    changed = dict(valid, **{field: value})
    rejected(lambda: gateway.validate_manifest(changed, 'c' * 64))
rejected(lambda: gateway.validate_manifest(dict(valid, command='sh'), 'c' * 64))

with tempfile.TemporaryDirectory(prefix='wm-gateway-files-') as folder:
    root = Path(folder)
    inbox = root / 'inbox'
    inbox.mkdir()
    source = inbox / 'source'
    source.write_bytes(b'synthetic')
    (inbox / 'link').symlink_to(source)
    os.mkfifo(inbox / 'pipe')
    directory = os.open(inbox, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        assert gateway.copy_input(directory, 'source', root / 'copied', os.getuid(), 20) == hashlib.sha256(b'synthetic').hexdigest()
        rejected(lambda: gateway.copy_input(directory, 'link', root / 'link-copy', os.getuid(), 20))
        rejected(lambda: gateway.copy_input(directory, 'pipe', root / 'pipe-copy', os.getuid(), 20))
        rejected(lambda: gateway.copy_input(directory, 'source', root / 'large-copy', os.getuid(), 2))
        rejected(lambda: gateway.copy_input(directory, 'source', root / 'owner-copy', os.getuid() + 1, 20))
    finally:
        os.close(directory)

with tempfile.TemporaryDirectory(prefix='wm-gateway-queue-') as folder:
    root = Path(folder)
    inbox, install, jobs = (root / name for name in ['inbox', 'install', 'jobs'])
    for directory in [inbox, install, jobs]: directory.mkdir()
    helper = b'# fixed installed deployment helper\n'
    (install / 'owner-deploy.py').write_bytes(helper)
    # Uploaded Python must never become the privileged executable.
    (inbox / 'owner-deploy.py').write_text('raise AssertionError("untrusted upload")')
    bundle = b'synthetic bundle'
    (inbox / 'wedding-market-remediation.bundle').write_bytes(bundle)
    record = manifest(hashlib.sha256(helper).hexdigest(), hashlib.sha256(bundle).hexdigest())
    payload = json.dumps(record).encode()
    (inbox / 'release-manifest.json').write_bytes(payload)
    digest = hashlib.sha256(payload).hexdigest()
    calls = []

    def systemd(args, **kwargs):
        calls.append((args, kwargs))
        return SimpleNamespace(stdout='inactive\n', returncode=0)

    with patch.object(gateway, 'INBOX', inbox), patch.object(gateway, 'INSTALL', install), \
         patch.object(gateway, 'JOBS', jobs), patch('os.geteuid', return_value=0), \
         patch('pwd.getpwnam', return_value=SimpleNamespace(pw_uid=os.getuid())), \
         patch.object(sys, 'argv', ['gateway', digest]), patch.dict(os.environ, {'SUDO_USER': gateway.AUDIT_USER}), \
         patch.object(subprocess, 'run', side_effect=systemd), contextlib.redirect_stdout(io.StringIO()):
        gateway.main()
        job = next(jobs.glob('release-*'))
        assert (job / 'owner-deploy.py').read_bytes() == helper
        command = calls[-1][0]
        assert command[0] == '/usr/bin/systemd-run'
        assert '--unit=wedding-market-release' in command and '--collect' in command
        assert '/usr/bin/python3' in command and '-I' in command
        assert command[-1] == digest and '--manifest-sha' in command
        assert calls[-1][1].get('shell', False) is False
        assert calls[-1][1]['env'] == gateway.CONTROL_ENV
        calls.clear()
        with patch.object(subprocess, 'run', return_value=SimpleNamespace(stdout='active\n')):
            rejected(gateway.main)
        assert not calls
        with patch.object(sys, 'argv', ['gateway', '--help']): rejected(gateway.main)
        with patch.object(sys, 'argv', ['gateway', digest, 'sh']): rejected(gateway.main)
        with patch.object(sys, 'argv', ['gateway', '0' * 64]): rejected(gateway.main)

print('PASS: strict manifests, fixed installed helper, isolated detached job, active-job rejection, digest/argument checks, symlink/FIFO/size/owner protections; no root, PM2 or network changes.')
