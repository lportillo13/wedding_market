#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/var/www/wedding-market}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  printf 'Run this installer as root: sudo bash %s/deploy/install-deployer.sh\n' "$APP_DIR" >&2
  exit 1
fi

id "$DEPLOY_USER" >/dev/null 2>&1 || {
  printf 'Deployment user does not exist: %s\n' "$DEPLOY_USER" >&2
  exit 1
}

chown "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR/deploy/deploy-if-changed.sh"
chmod 0700 "$APP_DIR/deploy/deploy-if-changed.sh"

install -m 0644 "$APP_DIR/deploy/wedding-market-deploy.service" /etc/systemd/system/wedding-market-deploy.service
install -m 0644 "$APP_DIR/deploy/wedding-market-deploy.timer" /etc/systemd/system/wedding-market-deploy.timer

systemctl daemon-reload
systemctl enable --now wedding-market-deploy.timer

printf 'Installed Wedding Market branch deployer.\n'
printf 'First deployment after the bootstrap git pull:\n'
printf '  %s/deploy/deploy-if-changed.sh --force\n' "$APP_DIR"
printf 'Later change-only check: systemctl start wedding-market-deploy.service\n'
printf 'Follow logs: journalctl -u wedding-market-deploy.service -f\n'
printf 'Timer status: systemctl status wedding-market-deploy.timer\n'
