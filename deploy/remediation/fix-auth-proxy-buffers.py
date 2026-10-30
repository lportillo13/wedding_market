#!/usr/bin/env python3
"""Owner-run repair for Wedding Market auth response headers; no gateway changes."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import time

SITE = Path('/etc/nginx/sites-available/thewedmarket.com')
ANCHOR = 'proxy_pass http://127.0.0.1:3001;'
BLOCK = '''# Wedding Market: allow chunked auth cookies and refresh response headers.
        proxy_buffer_size 32k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;'''


def auth_gateway_errors(text, now):
    cutoff = now - datetime.timedelta(minutes=15)
    counts = {'authHeaderTooBig': 0, 'authTimeouts': 0, 'authConnectionFailures': 0}
    for line in text.splitlines():
        if 'thewedmarket.com' not in line or '/auth/callback' not in line:
            continue
        try:
            stamp = datetime.datetime.strptime(line[:19], '%Y/%m/%d %H:%M:%S')
        except ValueError:
            continue
        if stamp < cutoff or stamp > now:
            continue
        if 'upstream sent too big header' in line:
            counts['authHeaderTooBig'] += 1
        elif 'upstream timed out' in line:
            counts['authTimeouts'] += 1
        elif 'connect() failed' in line or 'upstream prematurely closed connection' in line:
            counts['authConnectionFailures'] += 1
    return counts


def recent_gateway_errors():
    with Path('/var/log/nginx/error.log').open('rb') as log:
        log.seek(max(0, os.fstat(log.fileno()).st_size - 262144))
        return auth_gateway_errors(log.read().decode('utf8', 'replace'), datetime.datetime.now())


def patch_site(source):
    names = re.findall(r'^\s*server_name\s+([^;]+);', source, re.M)
    if not names or any(name not in {'thewedmarket.com', 'www.thewedmarket.com'}
                        for group in names for name in group.split()):
        raise ValueError('Unexpected virtual host; no change made.')
    if source.count(ANCHOR) != 1 or re.search(r'proxy_pass\s+(?!http://127\.0\.0\.1:3001;)', source):
        raise ValueError('Unexpected upstream layout; no change made.')
    if BLOCK in source:
        if source.count(BLOCK) != 1:
            raise ValueError('Duplicate managed block; review required.')
        return source
    if re.search(r'^\s*proxy_(?:buffer_size|buffers|busy_buffers_size)\s', source, re.M):
        raise ValueError('Existing custom buffers require review; no change made.')
    return source.replace(ANCHOR, ANCHOR + '\n        ' + BLOCK)


def atomic_write(path, content, permissions):
    descriptor, temporary = tempfile.mkstemp(prefix='.wm-auth-proxy-', dir=path.parent)
    try:
        with os.fdopen(descriptor, 'w', encoding='utf8', newline='\n') as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
            os.fchmod(output.fileno(), permissions)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def nginx_test():
    result = subprocess.run(['nginx', '-t'], capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError('Nginx configuration validation failed; existing configuration retained.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', required=True)
    parser.add_argument('--expected-site-sha256', required=True)
    args = parser.parse_args()
    if not hasattr(os, 'geteuid') or os.geteuid() != 0:
        raise PermissionError('Run this reviewed file in the owner root terminal.')
    info = SITE.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or info.st_gid != 0 or info.st_nlink != 1 or info.st_mode & 0o022:
        raise ValueError('Expected a regular root-owned, non-writable site file.')
    source = SITE.read_text(encoding='utf8')
    updated = patch_site(source)
    nginx_test()
    if source == updated:
        print(json.dumps({'changed': False, 'site': SITE.name, 'buffersAlreadyConfigured': True}))
        return
    if not re.fullmatch(r'[a-f0-9]{64}', args.expected_site_sha256) or hashlib.sha256(source.encode()).hexdigest() != args.expected_site_sha256:
        raise ValueError('Site configuration changed since review; no change made.')
    diagnosis = recent_gateway_errors()
    print(json.dumps({'diagnosticWindowMinutes': 15, 'gatewayErrors': diagnosis}))
    if diagnosis['authHeaderTooBig'] == 0:
        raise ValueError('No recent auth-callback header overflow confirmed; no configuration changed. Review the diagnostic counts before proceeding.')
    backup = Path('/var/backups/wedding-market-auth-proxy') / time.strftime('%Y%m%d-%H%M%S', time.gmtime())
    backup.mkdir(parents=True, mode=0o700, exist_ok=False)
    shutil.copy2(SITE, backup / SITE.name)
    (backup / SITE.name).chmod(0o600)
    permissions = stat.S_IMODE(info.st_mode)
    try:
        atomic_write(SITE, updated, permissions)
        nginx_test()
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True, capture_output=True)
    except Exception:
        atomic_write(SITE, source, permissions)
        nginx_test()
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True, capture_output=True)
        raise
    print(json.dumps({'changed': True, 'site': SITE.name, 'backup': str(backup),
                      'headerBuffer': '32k', 'bodyBuffers': '4 32k',
                      'siteSha256': hashlib.sha256(updated.encode()).hexdigest(),
                      'nginxValidatedAndReloaded': True, 'otherSiteFilesChanged': False}))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(json.dumps({'success': False, 'errorType': type(error).__name__, 'message': str(error)}))
        raise SystemExit(1)
