#!/usr/bin/env bash
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Use the existing root terminal.'; exit 1; fi
private=/root/wm-security-finish-20261019
if [ ! -d "$private/backup-runtime" ] || [ -L "$private" ]; then
  echo 'The existing reviewed backup tool folder was not found.'; exit 1
fi
install -m 700 /home/wm-audit-20261019/owner-backup-setup.py "$private/owner-backup-setup.py"
install -m 700 /home/wm-audit-20261019/owner-wrap-recovery-key.py "$private/owner-wrap-recovery-key.py"
cd "$private"
printf '%s  %s\n' \
  'ee5d28eca5e7cac7abab458925e094cd760dd1f3a5ec8c8888ca68546acfeef9' owner-backup-setup.py \
  'cfb7fc23d3e52a8d3b4d2de8c7cebb0320dfa39e11f22cd5dbe038b8f3b57021' owner-wrap-recovery-key.py | sha256sum -c -
echo 'Checking for an existing Wedding Market database connection without displaying it.'
if python3 owner-backup-setup.py --certificate "$private/prod-ca-2021.crt" --configured-connection; then
  echo 'Database backup setup completed.'
else
  echo 'Database backup setup needs follow-up. The existing media backup timer remains installed.'
fi
echo 'Protecting the recovery identity for independent storage.'
echo 'Choose a unique passphrase of at least 16 characters and save it in your password manager.'
echo 'Enter it only in the next two hidden terminal prompts. Do not send it to chat.'
python3 owner-wrap-recovery-key.py
echo 'Recovery identity prepared. The owner must approve any off-host transfer separately.'
