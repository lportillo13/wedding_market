#!/usr/bin/env bash
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Use the existing root terminal.'; exit 1; fi
install -d -m 700 /root/wm-remediation-20261019
for name in owner-deploy.py owner-origin-hardening.py owner-service-key.py release-manifest.json wedding-market-remediation.bundle; do
  install -m 600 "/home/wm-audit-20261019/$name" /root/wm-remediation-20261019/
done
cd /root/wm-remediation-20261019
printf '%s  %s\n' '8c43ad5cecd76911e3a57460c15370c37a23fdfa8026c444e92593b19ebe4336' owner-deploy.py '0061b6b6ec487577c97bef773f784c71fed974cc93a24b4a21d974a948b89cd1' release-manifest.json | sha256sum -c -
python3 owner-deploy.py --manifest-sha 0061b6b6ec487577c97bef773f784c71fed974cc93a24b4a21d974a948b89cd1
python3 owner-origin-hardening.py
