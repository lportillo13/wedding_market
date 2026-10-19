#!/usr/bin/env bash
# Root only copies checksum-verified tools; Git, builds and PM2 run as deploy.
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Use the existing root terminal.'; exit 1; fi
if [ "$#" -ne 2 ] || [[ ! "$1" =~ ^[a-f0-9]{64}$ ]] || [[ ! "$2" =~ ^[a-f0-9]{64}$ ]]; then
  echo 'Pass the reviewed manifest and deployment-tool SHA256 values.'; exit 1
fi
install -d -m 700 /root/wm-application-release-20261019
for name in owner-deploy.py release-manifest.json wedding-market-remediation.bundle; do
  install -m 600 "/home/wm-audit-20261019/application-release-20261019/$name" /root/wm-application-release-20261019/
done
cd /root/wm-application-release-20261019
printf '%s  %s\n' "$1" release-manifest.json "$2" owner-deploy.py | sha256sum -c -
python3 owner-deploy.py --manifest-sha "$1"
