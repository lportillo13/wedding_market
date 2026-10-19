#!/usr/bin/env python3
"""Restrict only Wedding Market's Nginx proxy; preserve ACME and other sites."""
import ipaddress
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import subprocess
import time
import urllib.request

SITE = Path('/etc/nginx/sites-available/thewedmarket.com')
ACCESS = Path('/etc/nginx/snippets/wedding-market-cloudflare.conf')
RATE = Path('/etc/nginx/conf.d/wedding-market-rate.conf')


def rules(ipv4, ipv6):
    networks = []
    for version, lines in [(4, ipv4), (6, ipv6)]:
        parsed = [ipaddress.ip_network(line.strip()) for line in lines.splitlines() if line.strip()]
        if not parsed or any(n.version != version or n.prefixlen < (8 if version == 4 else 19) for n in parsed):
            raise ValueError('Unexpected Cloudflare address response.')
        networks.extend(parsed)
    if len(networks) < 10 or len(networks) > 100:
        raise ValueError('Unexpected Cloudflare range count.')
    return '# Official Cloudflare ranges; review monthly.\nallow 127.0.0.1;\nallow ::1;\n' + ''.join('allow %s;\n' % n for n in networks) + 'deny all;\n'


def patch_site(source):
    if 'wedding-market-cloudflare.conf' in source:
        raise ValueError('Hardening already present; verify it instead of reapplying.')
    if source.count('location / {') != 1 or 'proxy_pass http://127.0.0.1:3001;' not in source:
        raise ValueError('The audited proxy layout changed.')
    if 'location /.well-known/acme-challenge/' not in source:
        raise ValueError('Expected ACME exception is missing.')
    return source.replace('location / {', '''location / {
        include /etc/nginx/snippets/wedding-market-cloudflare.conf;
        limit_req zone=wm_api_per_visitor burst=20 nodelay;
        limit_req_status 429;''')


def main():
    if os.geteuid() != 0:
        raise ValueError('Use the existing root terminal.')
    if SITE.is_symlink() or not SITE.is_file() or ACCESS.exists() or RATE.exists():
        raise ValueError('Unexpected existing configuration; review before changing it.')
    full = subprocess.check_output(['nginx', '-T'], stderr=subprocess.STDOUT).decode()
    if re.search(r'^\s*(real_ip_header|set_real_ip_from)\s', full, re.M):
        raise ValueError('Existing real-IP rewriting requires a different allowlist placement.')
    source = SITE.read_text()
    updated = patch_site(source)
    responses = []
    for family in ['v4', 'v6']:
        with urllib.request.urlopen('https://www.cloudflare.com/ips-' + family, timeout=20) as response:
            responses.append(response.read(20000).decode('ascii'))
    access = rules(*responses)
    # The header is trusted only after the proxy's source address passes the allowlist.
    rate = '''# Used only in Wedding Market's location; other virtual hosts have no limit_req.
map $uri $wm_api_client {
    default "";
    ~^/api/ $http_cf_connecting_ip;
}
limit_req_zone $wm_api_client zone=wm_api_per_visitor:10m rate=5r/s;
'''
    backup = Path('/var/backups/wedding-market-nginx') / time.strftime('%Y%m%d-%H%M%S', time.gmtime())
    backup.mkdir(parents=True, mode=0o700)
    shutil.copy2(SITE, backup / SITE.name)
    (backup / SITE.name).chmod(0o600)
    result = {'originHardened': False, 'backup': str(backup)}
    try:
        ACCESS.write_text(access)
        RATE.write_text(rate)
        SITE.write_text(updated)
        for path in [ACCESS, RATE, SITE]:
            path.chmod(0o644)
        subprocess.run(['nginx', '-t'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
        result['originHardened'] = True
        result['cloudflareRanges'] = access.count('allow ') - 2
        print('Wedding Market origin allowlist and API rate limit installed. Verify the public site and direct-origin rejection.')
    except Exception:
        shutil.copy2(backup / SITE.name, SITE)
        SITE.chmod(0o644)
        ACCESS.unlink(missing_ok=True)
        RATE.unlink(missing_ok=True)
        subprocess.run(['nginx', '-t'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
        result['rolledBack'] = True
        raise
    finally:
        target = Path('/home/wm-audit-20261019/owner-origin-results.json')
        target.write_text(json.dumps(result, indent=2) + '\n')
        audit = pwd.getpwnam('wm-audit-20261019')
        os.chown(target, audit.pw_uid, audit.pw_gid)
        target.chmod(0o600)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Origin change stopped. Review the current Nginx configuration and sanitized result.')
        raise SystemExit(1) from None
