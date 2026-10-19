#!/usr/bin/env bash
# Owner-authorized audit using an unprivileged account. No writes or secret values.
set -u
printf '\nCollected at UTC\n'
date -u '+%Y-%m-%dT%H:%M:%SZ'
printf '\nIdentity and uptime\n'
hostname
id
uptime
printf '\nMemory\n'
free -m
printf '\nDisk and inodes\n'
df -h /
df -i /
printf '\nRuntime and OS\n'
node --version
cat /etc/os-release
printf '\nLargest process resource counters without command arguments\n'
ps -eo user,pid,ppid,%cpu,%mem,rss,etime,comm --sort=-rss | head -n 18
printf '\nListening TCP sockets\n'
ss -lnt
printf '\nApplication revision\n'
git -c safe.directory=/var/www/wedding-market -C /var/www/wedding-market rev-parse HEAD
printf '\nEnvironment permissions only\n'
find /var/www/wedding-market -maxdepth 1 -type f -name '.env*' -printf '%M %u %g %p\n'
printf '\nInstalled application package versions\n'
node - <<'NODE'
const fs=require('node:fs');
const root='/var/www/wedding-market/';
for (const name of ['next','react','sharp','@supabase/supabase-js']) {
  try { const d=JSON.parse(fs.readFileSync(root+'node_modules/'+name+'/package.json','utf8')); console.log(JSON.stringify({name,version:d.version})); }
  catch(e) { console.log(JSON.stringify({name,error:e.code})); }
}
try { console.log(JSON.stringify({buildId:fs.readFileSync(root+'.next/BUILD_ID','utf8').trim()})); }
catch(e) { console.log(JSON.stringify({buildIdError:e.code})); }
NODE
printf '\nApplication build and dependency sizes\n'
du -sh /var/www/wedding-market/.next /var/www/wedding-market/node_modules /var/www/wedding-market/public 2>/dev/null
printf '\nRelevant system timers\n'
systemctl list-timers --all --no-pager | grep -Ei 'NEXT|certbot|wedding|logrotate|apt-daily' || true
printf '\nReadable SSH policy directives\n'
grep -Ehi '^[[:space:]]*(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|PermitEmptyPasswords|MaxAuthTries|AllowUsers|Include)[[:space:]]' /etc/ssh/sshd_config /etc/ssh/sshd_config.d/*.conf 2>/dev/null || true
printf '\nReadable Wedding Market Nginx directives\n'
for file in /etc/nginx/sites-enabled/thewedmarket.com /etc/nginx/sites-available/thewedmarket.com; do
  if [ -r "$file" ]; then
    printf '%s\n' "$file"
    grep -E '^[[:space:]]*(listen|server_name|proxy_pass|client_max_body_size|limit_req|limit_conn|ssl_protocols|ssl_certificate[[:space:]]|add_header|access_log|error_log)' "$file"
    break
  fi
done
printf '\nReadability of protected paths\n'
for path in /home/deploy/.pm2 /home/deploy/deploy-wm.sh /var/www/wedding-market/.env.production.local /var/log/nginx/access.log /etc/ufw/user.rules; do
  if [ -r "$path" ]; then printf 'readable %s\n' "$path"; else printf 'protected %s\n' "$path"; fi
done
printf '\nLoopback health status\n'
curl --max-time 10 --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:3001/api/health
