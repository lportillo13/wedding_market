#!/usr/bin/env python3
"""One read-only PostgreSQL connection check; never print or persist the URI."""
import getpass
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlparse


def main():
    if os.geteuid() != 0 or not os.isatty(0):
        raise ValueError('Use the owner interactive root terminal.')
    uri = getpass.getpass('Wedding Market PostgreSQL URI (hidden; not saved): ').strip()
    if re.search(r'YOUR[-_ ]?PASSWORD|DATABASE[-_ ]?PASSWORD', uri, re.I):
        print(json.dumps({'connected': False, 'reason': 'password-placeholder-not-replaced', 'credentialsPrinted': False}))
        return 2
    parsed = urlparse(uri)
    project = 'aousexbvujjnvbudpsmz'
    user, host = unquote(parsed.username or ''), parsed.hostname or ''
    direct = host == 'db.' + project + '.supabase.co' and user == 'postgres'
    pool = re.fullmatch(r'aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com', host) and user == 'postgres.' + project
    if parsed.scheme not in ('postgres', 'postgresql') or not (direct or pool) or (parsed.port or 5432) != 5432 or parsed.path != '/postgres' or not parsed.password:
        raise ValueError('Use this project direct/session URI on port5432.')
    password = unquote(parsed.password)
    if re.search(r'YOUR[-_ ]?PASSWORD|DATABASE[-_ ]?PASSWORD', password, re.I):
        print(json.dumps({'connected': False, 'reason': 'password-placeholder-not-replaced', 'credentialsPrinted': False}))
        return 2
    certificate = Path('/etc/wedding-market-backups/server-ca.crt')
    if not certificate.is_file() or certificate.is_symlink():
        raise ValueError('Verified server CA bundle is required.')
    env = {'PATH': '/usr/bin:/bin', 'PGHOST': host, 'PGPORT': '5432', 'PGUSER': user,
           'PGPASSWORD': password, 'PGDATABASE': 'postgres', 'PGSSLMODE': 'verify-full',
           'PGSSLROOTCERT': str(certificate), 'PGCONNECT_TIMEOUT': '15',
           'PGOPTIONS': '-c default_transaction_read_only=on -c statement_timeout=10000',
           'PGAPPNAME': 'wedding-market-owner-connection-check'}
    try:
        result = subprocess.run(['/usr/lib/postgresql/17/bin/psql', '-X', '-A', '-t',
                                 '--set=ON_ERROR_STOP=1', '--command=SELECT 1'],
                                env=env, capture_output=True, text=True, timeout=25)
    except subprocess.TimeoutExpired:
        print(json.dumps({'connected': False, 'reason': 'connection-timeout', 'credentialsPrinted': False}))
        return 2
    connected = result.returncode == 0 and result.stdout.strip() == '1'
    reason = 'database-authentication-and-TLS-verified' if connected else 'unclassified-connection-error'
    for pattern, label in [('password authentication failed', 'database-password-rejected'),
                           ('certificate|SSL error', 'certificate-validation-failed'),
                           ('could not translate host name', 'database-DNS-failed'),
                           ('Network is unreachable|Connection refused|timeout expired', 'database-network-failed'),
                           ('Tenant or user not found', 'pooler-project-or-user-mismatch')]:
        if not connected and re.search(pattern, result.stderr, re.I):
            reason = label
            break
    print(json.dumps({'connected': connected, 'reason': reason, 'readOnlyQuery': True,
                      'databaseBackupCreated': False, 'credentialsPrinted': False, 'credentialsSaved': False}))
    return 0 if connected else 2


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (ValueError, OSError):
        print('Connection check stopped. Verify the project URI, installed PostgreSQL17 client and CA bundle. No credential was printed or saved.')
        raise SystemExit(1) from None
