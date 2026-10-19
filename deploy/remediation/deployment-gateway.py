#!/usr/bin/python3 -I
"""Fixed privileged entry point: accepts only a Wedding Market release digest.

Untrusted uploads are data only. The deployment helper always comes from the
root-owned installation, and Git, dependency scripts, builds and PM2 run as deploy.
"""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import pwd
import re
import stat
import subprocess
import sys
import tempfile

AUDIT_USER = 'wm-audit-20261019'
INBOX = Path('/home/wm-audit-20261019/deployment-inbox')
INSTALL = Path('/usr/local/lib/wedding-market-release')
JOBS = Path('/var/backups/wedding-market-deploy/gateway-jobs')
HEX40 = re.compile(r'[a-f0-9]{40}')
HEX64 = re.compile(r'[a-f0-9]{64}')
CONTROL_ENV = {'PATH': '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
               'HOME': '/root', 'LANG': 'C.UTF-8'}


def copy_input(directory, name, destination, owner_uid, maximum):
    flags = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK
    descriptor = os.open(name, flags, dir_fd=directory)
    with os.fdopen(descriptor, 'rb') as source:
        info = os.fstat(source.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != owner_uid or not 0 < info.st_size <= maximum:
            raise ValueError('Invalid upload file.')
        digest = hashlib.sha256()
        copied = 0
        with destination.open('xb') as output:
            os.fchmod(output.fileno(), 0o600)
            while chunk := source.read(1024 * 1024):
                copied += len(chunk)
                if copied > maximum:
                    raise ValueError('Upload exceeded its size limit.')
                digest.update(chunk)
                output.write(chunk)
        return digest.hexdigest()


def validate_manifest(manifest, helper_sha):
    keys = {'commit', 'expectedBaseCommit', 'bundleSha256', 'preservedProductionPatchFiles',
            'preservedProductionHashes', 'mediaDomainReady', 'requiredPublicMarkup', 'toolHashes'}
    if not isinstance(manifest, dict) or set(manifest) != keys:
        raise ValueError('Unexpected manifest fields.')
    for key in ['commit', 'expectedBaseCommit']:
        if not isinstance(manifest[key], str) or not HEX40.fullmatch(manifest[key]):
            raise ValueError('Invalid release identity.')
    if not isinstance(manifest['bundleSha256'], str) or not HEX64.fullmatch(manifest['bundleSha256']):
        raise ValueError('Invalid bundle digest.')
    if manifest['preservedProductionPatchFiles'] != [] or manifest['preservedProductionHashes'] != {}:
        raise ValueError('This gateway only accepts clean managed releases.')
    if manifest['mediaDomainReady'] is not False:
        raise ValueError('Environment overrides require the owner.')
    if manifest['toolHashes'] != {'owner-deploy.py': helper_sha}:
        raise ValueError('Deployment tool updates require the owner.')
    markers = manifest['requiredPublicMarkup']
    if not isinstance(markers, list) or len(markers) > 10 or any(
        not isinstance(value, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,100}', value) for value in markers
    ):
        raise ValueError('Invalid public release checks.')


def main():
    if os.geteuid() != 0 or len(sys.argv) != 2 or not HEX64.fullmatch(sys.argv[1]):
        raise ValueError('Pass exactly one reviewed manifest SHA256.')
    audit = pwd.getpwnam(AUDIT_USER)
    if os.environ.get('SUDO_USER', AUDIT_USER) not in (AUDIT_USER, 'root'):
        raise ValueError('Unexpected deployment caller.')
    # Serialize intake and reject a second release while the detached job runs.
    with (JOBS / 'intake.lock').open('a') as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = subprocess.run(
            ['/usr/bin/systemctl', 'is-active', 'wedding-market-release.service'],
            capture_output=True, text=True, check=False, env=CONTROL_ENV).stdout.strip()
        if state not in ('inactive', 'failed', 'unknown'):
            raise ValueError('A deployment is running or its state is unavailable.')
        job = Path(tempfile.mkdtemp(prefix='release-', dir=JOBS))
        helper = INSTALL / 'owner-deploy.py'
        helper_source = helper.read_bytes()
        helper_sha = hashlib.sha256(helper_source).hexdigest()
        directory = os.open(INBOX, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        try:
            manifest_sha = copy_input(directory, 'release-manifest.json', job / 'release-manifest.json', audit.pw_uid, 65536)
            if manifest_sha != sys.argv[1]:
                raise ValueError('Manifest checksum mismatch.')
            manifest = json.loads((job / 'release-manifest.json').read_text())
            validate_manifest(manifest, helper_sha)
            bundle_sha = copy_input(directory, 'wedding-market-remediation.bundle',
                                    job / 'wedding-market-remediation.bundle', audit.pw_uid, 128 * 1024**2)
            if bundle_sha != manifest['bundleSha256']:
                raise ValueError('Bundle checksum mismatch.')
        finally:
            os.close(directory)
        (job / 'owner-deploy.py').write_bytes(helper_source)
        (job / 'owner-deploy.py').chmod(0o600)
        subprocess.run([
            '/usr/bin/systemd-run', '--quiet', '--collect', '--no-block',
            '--unit=wedding-market-release', '--property=Type=exec', '--property=UMask=0077',
            '--property=WorkingDirectory=' + str(job),
            '--property=Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
            '/usr/bin/flock', '-n', '/var/backups/wedding-market-deploy/gateway-execution.lock',
            '/usr/bin/python3', '-I', str(job / 'owner-deploy.py'), '--manifest-sha', manifest_sha,
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=CONTROL_ENV)
        print(json.dumps({'accepted': True, 'releaseCommit': manifest['commit'],
                          'unit': 'wedding-market-release.service', 'continuesAfterDisconnect': True}))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.SubprocessError, RecursionError):
        print('Deployment request rejected. Check the reviewed manifest, installed tool version and job status.')
        raise SystemExit(1) from None
