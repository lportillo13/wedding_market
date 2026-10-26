#!/usr/bin/env bash
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
[[ $(id -u) == 0 ]] || { echo 'Run from the owner root terminal.' >&2; exit 1; }
[[ $# == 0 || ( $# == 1 && ${1:-} == --enable-timer ) ]] || { echo 'Invalid arguments.' >&2; exit 1; }
source_file=/var/www/wedding-market/deploy/maintenance/owner-release-retention.py
expected=4152d3770f24f72df9759d4cdb7a5e8539b21f0f00b23801dbcf1ff346e85365
printf '%s  %s\n' "$expected" "$source_file" | sha256sum -c -
directory=/usr/local/lib/wedding-market-maintenance
[[ ! -L $directory ]] || { echo 'Maintenance directory is a symlink.' >&2; exit 1; }
if [[ -e $directory ]]; then
  [[ $(stat -c %u "$directory") == 0 && $(stat -c %a "$directory") == 750 ]] || { echo 'Review the existing maintenance directory.' >&2; exit 1; }
else
  install -d -o root -g root -m 0750 "$directory"
fi
destination=$directory/release-retention.py
[[ ! -L $destination ]] || { echo 'Installed helper is a symlink.' >&2; exit 1; }
if [[ -e $destination ]]; then
  [[ $(sha256sum "$destination" | cut -d' ' -f1) == "$expected" ]] || { echo 'Review the existing helper before upgrading it.' >&2; exit 1; }
else
  install -o root -g root -m 0750 "$source_file" "$destination"
fi
temporary=$(mktemp -d "$directory/install.XXXXXX")
trap 'rm -f "$temporary/wedding-market-retention.service" "$temporary/wedding-market-retention.timer"; rmdir "$temporary"' EXIT
cat > "$temporary/wedding-market-retention.service" <<'UNIT'
[Unit]
Description=Prune verified superseded Wedding Market builds
[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /usr/local/lib/wedding-market-maintenance/release-retention.py --apply
Nice=10
CPUQuota=20%
MemoryMax=128M
TimeoutStartSec=10min
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectHome=read-only
ProtectSystem=strict
ReadWritePaths=/var/www/wedding-market-releases /var/backups/wedding-market-deploy
RestrictAddressFamilies=AF_UNIX
UNIT
cat > "$temporary/wedding-market-retention.timer" <<'UNIT'
[Unit]
Description=Daily Wedding Market build retention
[Timer]
OnCalendar=*-*-* 06:30:00 UTC
RandomizedDelaySec=30min
Persistent=true
[Install]
WantedBy=timers.target
UNIT
for name in wedding-market-retention.service wedding-market-retention.timer; do
  target=/etc/systemd/system/$name
  [[ ! -L $target ]] || { echo 'Existing systemd unit is a symlink.' >&2; exit 1; }
  if [[ -e $target ]]; then
    cmp -s "$temporary/$name" "$target" || { echo 'Review the existing systemd unit before replacing it.' >&2; exit 1; }
  else
    install -o root -g root -m 0644 "$temporary/$name" "$target"
  fi
done
systemctl daemon-reload
/usr/bin/python3 "$destination"
if [[ ${1:-} == --enable-timer ]]; then
  systemctl enable --now wedding-market-retention.timer
  systemctl show wedding-market-retention.timer -p ActiveState -p NextElapseUSecRealtime
else
  echo 'Dry run complete. Review eligible paths; enable wedding-market-retention.timer when ready.'
fi
