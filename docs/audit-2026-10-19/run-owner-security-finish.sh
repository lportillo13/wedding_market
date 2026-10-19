#!/usr/bin/env bash
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Use the existing root terminal.'; exit 1; fi
install -d -m 700 /root/wm-security-finish-20261019
install -m 600 /home/wm-audit-20261019/owner-security-tools.tar /root/wm-security-finish-20261019/
cd /root/wm-security-finish-20261019
printf '%s  %s\n' 'd6beb6a22344ff28b804c37546a69fdac4fbf5a4198b7f17db34717d2afeb1f5' owner-security-tools.tar | sha256sum -c -
tar -xf owner-security-tools.tar
python3 owner-origin-hardening.py
python3 owner-backup-setup.py --r2-only
