#!/usr/bin/env bash
# Read-only audit. Does not restart services, read environment values, or query application rows.
set -u
printf '\nCollected at UTC\n'
date -u '+%Y-%m-%dT%H:%M:%SZ'
printf '\nHost uptime\n'
hostname
uptime
printf '\nMemory\n'
free -m
printf '\nDisk and inodes\n'
df -h / /var/www/wedding-market
df -i / /var/www/wedding-market
printf '\nOS and Node versions\n'
cat /etc/os-release
node --version
printf '\nProcess resource summary without arguments\n'
ps -eo user,pid,ppid,%cpu,%mem,rss,etime,comm --sort=-rss | head -n 18
printf '\nApplication revision and working tree\n'
sudo -u deploy -H git -C /var/www/wedding-market rev-parse HEAD
sudo -u deploy -H git -C /var/www/wedding-market status --short --branch
printf '\nPM2 process metadata without environment or command arguments\n'
sudo -u deploy -H pm2 jlist 2>/dev/null | node -e '
let data=""; process.stdin.on("data",x=>data+=x); process.stdin.on("end",()=>{
 try { const processes=JSON.parse(data); console.log(JSON.stringify(processes.map(x=>({
 name:x.name,pid:x.pid,status:x.pm2_env?.status,uptime:x.pm2_env?.pm_uptime,
 restarts:x.pm2_env?.restart_time,node:x.pm2_env?.node_version,
 resources:x.monit})),null,2)); } catch { console.log("Unable to parse PM2 status"); }
});'
printf '\nListening sockets\n'
ss -lntup
printf '\nFirewall\n'
ufw status verbose 2>/dev/null || true
printf '\nSSH authentication settings\n'
sshd -T 2>/dev/null | awk '$1 ~ /^(permitrootlogin|passwordauthentication|pubkeyauthentication|permitemptypasswords|maxauthtries|allowusers)$/ {print}'
printf '\nEnvironment file permissions only\n'
find /var/www/wedding-market -maxdepth 1 -type f -name '.env*' -printf '%M %u %g %p\n'
printf '\nServer deploy script metadata\n'
stat -c '%A %U %G %n' /home/deploy/deploy-wm.sh 2>/dev/null || true
printf '\nApplication and log directory sizes\n'
du -sh /var/www/wedding-market/.next /var/www/wedding-market/node_modules /home/deploy/.pm2/logs 2>/dev/null
printf '\nSystem timers\n'
systemctl list-timers --all --no-pager
printf '\nHealth endpoint\n'
curl --max-time 10 --silent --show-error --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:3001/api/health
