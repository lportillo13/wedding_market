#!/usr/bin/env bash
# Owner-only one-time installation. This template requires two reviewed hashes.
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Use the existing root terminal.'; exit 1; fi
if [ "$#" -ne 2 ] || [[ ! "$1" =~ ^[a-f0-9]{64}$ ]] || [[ ! "$2" =~ ^[a-f0-9]{64}$ ]]; then
  echo 'Pass the reviewed gateway and deployment-helper SHA256 values.'; exit 1
fi
source_dir=/home/wm-audit-20261019/deployment-setup
install -d -o root -g root -m 700 /usr/local/lib/wedding-market-release
install -d -o root -g root -m 700 /var/backups/wedding-market-deploy/gateway-jobs
install -m 600 "$source_dir/deployment-gateway.py" /usr/local/lib/wedding-market-release/gateway-reviewed.py
install -m 600 "$source_dir/owner-deploy.py" /usr/local/lib/wedding-market-release/helper-reviewed.py
printf '%s  %s\n' "$1" /usr/local/lib/wedding-market-release/gateway-reviewed.py "$2" /usr/local/lib/wedding-market-release/helper-reviewed.py | sha256sum -c -
/usr/bin/python3 -I -m py_compile /usr/local/lib/wedding-market-release/gateway-reviewed.py /usr/local/lib/wedding-market-release/helper-reviewed.py
for executable in /usr/bin/systemd-run /usr/bin/flock /usr/bin/pm2 /usr/sbin/visudo; do
  if [ ! -x "$executable" ]; then echo "Required executable unavailable: $executable"; exit 1; fi
done
/usr/bin/python3 -I - <<'PY_INBOX'
import os,pwd
audit=pwd.getpwnam('wm-audit-20261019')
parent=os.open('/home/wm-audit-20261019',os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
try:
    try: os.mkdir('deployment-inbox',mode=0o700,dir_fd=parent)
    except FileExistsError: pass
    inbox=os.open('deployment-inbox',os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=parent)
    try:
        os.fchown(inbox,audit.pw_uid,audit.pw_gid)
        os.fchmod(inbox,0o700)
    finally: os.close(inbox)
finally: os.close(parent)
PY_INBOX
install -o root -g root -m 755 /usr/local/lib/wedding-market-release/gateway-reviewed.py /usr/local/sbin/wedding-market-release
install -o root -g root -m 600 /usr/local/lib/wedding-market-release/helper-reviewed.py /usr/local/lib/wedding-market-release/owner-deploy.py
rule=$(mktemp /etc/sudoers.d/.wm-release-XXXXXX)
trap 'rm -f -- "$rule"' EXIT
printf '%s\n' 'wm-audit-20261019 ALL=(root) NOPASSWD: /usr/local/sbin/wedding-market-release' > "$rule"
chmod 440 "$rule"
/usr/sbin/visudo -cf "$rule"
if [ -e /etc/sudoers.d/wedding-market-release ]; then
  cp -p /etc/sudoers.d/wedding-market-release /usr/local/lib/wedding-market-release/previous-sudoers-rule
fi
install -o root -g root -m 440 "$rule" /etc/sudoers.d/wedding-market-release
if ! /usr/sbin/visudo -c >/dev/null 2>&1; then
  if [ -e /usr/local/lib/wedding-market-release/previous-sudoers-rule ]; then
    install -o root -g root -m 440 /usr/local/lib/wedding-market-release/previous-sudoers-rule /etc/sudoers.d/wedding-market-release
  else
    rm -f -- /etc/sudoers.d/wedding-market-release
  fi
  echo 'Sudoers validation failed; the previous rule was restored.'; exit 1
fi
echo 'Wedding Market deployment gateway installed. Only the fixed release command was authorized; no root shell access was granted.'
