#!/usr/bin/env bash
set -euo pipefail
umask 077
[[ $(id -u) == 0 && $# == 0 && -t 0 ]] || { echo 'Use the owner interactive root terminal, with no arguments.'; exit 1; }
source_dir=/home/wm-audit-20261019/owner-backup-readiness-20261027
[[ -d $source_dir && ! -L $source_dir && ! -L $source_dir/backup-runtime ]] || exit 1
cd "$source_dir"
printf '%s\n' \
  '81e85dca0506d9db1ebf20e39b1d41c7f117717c66d296d7276bb5a3f0542813  owner-backup-setup.py' \
  '6eb3a8c0b072ee73d071b25df39056241e4ce463f68e4fac4d82c23fd9532563  owner-backup.mjs' \
  'c76b611bbd91181d6f7b22f05f6eade494ea1c8f9bdfe002718bc69d420c6617  backup-streams.mjs' \
  '8f75cdcc0b0305e8c1d3739f3a1d8c084976419cb3b44e629c5ce89008a822b3  backup-runtime/package.json' \
  'c08cf6a25e939e5e9d028ea98b8f430e828d8fa8fba44136212ca2c276c3684b  backup-runtime/package-lock.json' | sha256sum -c -
[[ -f /etc/wedding-market-backups/identity.txt && ! -L /etc/wedding-market-backups/identity.txt ]] || { echo 'Existing recovery identity is required; do not replace it.'; exit 1; }
private=$(mktemp -d /root/wm-backup-readiness-20261027.XXXXXX)
install -d -m 700 "$private/backup-runtime"
for name in owner-backup-setup.py owner-backup.mjs backup-streams.mjs backup-runtime/package.json backup-runtime/package-lock.json; do
  [[ -f "$source_dir/$name" && ! -L "$source_dir/$name" ]] || exit 1
  install -m 600 "$source_dir/$name" "$private/$name"
done
cd "$private"
printf '%s\n' \
  '81e85dca0506d9db1ebf20e39b1d41c7f117717c66d296d7276bb5a3f0542813  owner-backup-setup.py' \
  '6eb3a8c0b072ee73d071b25df39056241e4ce463f68e4fac4d82c23fd9532563  owner-backup.mjs' \
  'c76b611bbd91181d6f7b22f05f6eade494ea1c8f9bdfe002718bc69d420c6617  backup-streams.mjs' \
  '8f75cdcc0b0305e8c1d3739f3a1d8c084976419cb3b44e629c5ce89008a822b3  backup-runtime/package.json' \
  'c08cf6a25e939e5e9d028ea98b8f430e828d8fa8fba44136212ca2c276c3684b  backup-runtime/package-lock.json' | sha256sum -c -
certificate=/root/wm-security-finish-20261019/prod-ca-2021.crt
[[ -f $certificate && ! -L $certificate ]] || { echo 'The reviewed public Supabase certificate is required.'; exit 1; }
echo 'Checking only the existing Wedding Market connection, without printing it.'
if ! python3 owner-backup-setup.py --certificate "$certificate" --configured-connection; then
  echo 'Paste the Wedding Market direct/session PostgreSQL URI only into the next hidden prompt.'
  echo 'Do not paste the password or connection URI into chat.'
  python3 owner-backup-setup.py --certificate "$certificate"
fi
echo 'The encrypted dump and archive inspection succeeded. A separate isolated restore remains required.'
