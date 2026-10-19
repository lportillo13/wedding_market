#!/usr/bin/env python3
"""Wrap the age recovery identity with an owner-only hidden passphrase."""
import getpass
import hashlib
import json
import os
from pathlib import Path
import pwd
import subprocess
import tempfile
import time


def wrap_file(source, encrypted, passphrase, gpg_home):
    gpg_home.mkdir(mode=0o700, exist_ok=True)
    args = ['/usr/bin/gpg', '--homedir', str(gpg_home), '--batch', '--yes', '--no-symkey-cache',
            '--pinentry-mode', 'loopback', '--passphrase-fd', '0']
    secret = (passphrase + '\n').encode()
    subprocess.run(args + ['--symmetric', '--cipher-algo', 'AES256', '--output', str(encrypted), '--', str(source)],
                   input=secret, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    restored = subprocess.check_output(args + ['--decrypt', str(encrypted)], input=secret, stderr=subprocess.DEVNULL)
    if hashlib.sha256(restored).digest() != hashlib.sha256(source.read_bytes()).digest():
        raise ValueError('Encrypted identity readback did not match.')
    encrypted.chmod(0o600)


def main():
    if os.geteuid() != 0 or not os.isatty(0):
        raise ValueError('Use the existing interactive root terminal.')
    os.umask(0o077)
    passphrase = getpass.getpass('Choose a recovery passphrase of at least 16 characters (hidden): ')
    if len(passphrase) < 16 or passphrase != getpass.getpass('Confirm the recovery passphrase (hidden): '):
        raise ValueError('Passphrases must match and contain at least 16 characters.')
    private = Path('/etc/wedding-market-backups')
    identity = private / 'identity.txt'
    encrypted = private / 'recovery-identity.gpg'
    wrap_file(identity, encrypted, passphrase, private / 'gpg-export')
    audit = pwd.getpwnam('wm-audit-20261019')
    destination = Path('/home/wm-audit-20261019') / ('wm-recovery-identity-' + time.strftime('%Y%m%dT%H%M%SZ', time.gmtime()) + '.gpg')
    descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    data = encrypted.read_bytes()
    with os.fdopen(descriptor, 'wb') as output:
        output.write(data)
        os.fchown(output.fileno(), audit.pw_uid, audit.pw_gid)
    result = {'wrappedRecoveryIdentity': str(destination), 'ciphertextSha256': hashlib.sha256(data).hexdigest(),
              'encryptedIdentityReadbackPassed': True, 'passphraseDisclosed': False, 'offHostCopy': False}
    target = destination.parent / 'owner-recovery-key-results.json'
    descriptor, temporary = tempfile.mkstemp(prefix='.wm-recovery-', dir=target.parent)
    with os.fdopen(descriptor, 'w') as output:
        output.write(json.dumps(result, indent=2) + '\n')
        os.fchown(output.fileno(), audit.pw_uid, audit.pw_gid)
    os.replace(temporary, target)
    print('Recovery identity encrypted and readback verified. Store the passphrase in your password manager; do not send it here.')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Recovery-key wrapping stopped; no passphrase or plaintext identity was printed.')
        raise SystemExit(1) from None
