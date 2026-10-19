#!/usr/bin/env bash
set -euo pipefail
umask 077
if [ "$(id -u)" -ne 0 ]; then echo 'Use the existing root terminal.'; exit 1; fi
install -d -m 700 /root/wm-remediation-20261019
for name in owner-deploy.py owner-origin-hardening.py owner-service-key.py release-manifest.json wedding-market-remediation.bundle; do
  install -m 600 "/home/wm-audit-20261019/$name" /root/wm-remediation-20261019/
done
cd /root/wm-remediation-20261019
printf '%s  %s\n' '851d933ff5a55a2cbece4b8f35433d29c9bebaa37390b67bacb0a2c9f8478ecc' owner-deploy.py '8e4d2f480e4f6e58c9690f85cab8002697082b7c1afb220ab98cae3f9c79ef14' release-manifest.json | sha256sum -c -
python3 - <<'PY_DIAGNOSTIC'
from pathlib import Path
import json,os,pwd
p=Path('/var/backups/wedding-market-deploy/20261019-184816/build.log')
text=p.read_text(errors='replace')[-150000:] if p.exists() else ''
result={
 'buildReachedNext':'next build' in text,
 'missingBuildModule':'Cannot find module' in text or 'Module not found' in text,
 'tailwindMentioned':'@tailwindcss/postcss' in text,
 'typescriptMentioned':'typescript' in text,
 'gitOwnershipError':'dubious ownership' in text,
 'installPermissionError':'EACCES' in text,
 'installNetworkError':any(s in text for s in ['ETIMEDOUT','ECONNRESET','ENOTFOUND']),
}
out=Path('/home/wm-audit-20261019/first-rollout-diagnostic.json')
out.write_text(json.dumps(result,indent=2)+'\n')
audit=pwd.getpwnam('wm-audit-20261019');os.chown(out,audit.pw_uid,audit.pw_gid);out.chmod(0o600)
PY_DIAGNOSTIC
python3 owner-deploy.py --manifest-sha 8e4d2f480e4f6e58c9690f85cab8002697082b7c1afb220ab98cae3f9c79ef14
python3 owner-origin-hardening.py
