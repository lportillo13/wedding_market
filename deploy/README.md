# Hetzner deployment

The host runs `dwlinks.com` from `/var/www/dw` under the `deploy` user's PM2
daemon on `127.0.0.1:3000`. Wedding Market is isolated as follows:

- Application: `/var/www/wedding-market`
- Environment: `/var/www/wedding-market/.env.production`
- PM2 name: `wedding-market`
- Loopback port: `3001`
- Nginx file: `/etc/nginx/sites-available/thewedmarket.com`
- Origin TLS: `/etc/ssl/cloudflare/thewedmarket.com.{pem,key}`

The existing `/var/www/dw`, PM2 application, Nginx file, certificate, and port
3000 are not modified.

## Build and private start

Next.js loads `.env.production` during the build and at runtime.

```bash
cd /var/www/wedding-market
sudo -u deploy -H npm ci
sudo -u deploy -H nice -n 10 npm run build
sudo -u deploy -H pm2 start deploy/ecosystem.config.cjs --only wedding-market
sudo -u deploy -H pm2 save
curl --fail http://127.0.0.1:3001/api/health
```

Do not use `npm start`; the package currently has a development-only local
Supabase pre-start hook.

## Branch-aware deployer

`deploy/deploy-if-changed.sh` is safe to run repeatedly over SSH. It checks
`origin/dev` and exits without rebuilding when the commit has not changed. If
there is a new fast-forward commit, it:

1. refuses to deploy a dirty or diverged server checkout;
2. acquires a lock so two deployments cannot overlap;
3. fast-forwards the `dev` branch;
4. runs `npm ci` and the production build;
5. restarts the `wedding-market` PM2 application;
6. waits for `/api/health`; and
7. restores the previous commit if the build, restart, or health check fails.

Run one check manually:

```bash
sudo -u deploy -H /usr/bin/bash /var/www/wedding-market/deploy/deploy-if-changed.sh
```

The first time, make sure the checkout is on `dev`, is clean, and can fetch the
GitHub repository non-interactively:

```bash
cd /var/www/wedding-market
sudo -u deploy -H git checkout dev
sudo -u deploy -H git pull --ff-only origin dev
sudo -u deploy -H git fetch origin dev
```

To check automatically every two minutes, install the included systemd service
and timer once:

```bash
cd /var/www/wedding-market
sudo bash deploy/install-deployer.sh
sudo systemctl start wedding-market-deploy.service
sudo systemctl status wedding-market-deploy.timer
sudo journalctl -u wedding-market-deploy.service -n 100 --no-pager
```

The defaults can be overridden for a manual run with environment variables such
as `DEPLOY_BRANCH`, `APP_DIR`, `PM2_APP_NAME`, and `HEALTH_URL`. If the server
uses another path or user, update the systemd service before installing it.

## Nginx and Cloudflare

The domain uses Cloudflare nameservers and proxied DNS. Install a Cloudflare
Origin CA certificate for `thewedmarket.com` and `*.thewedmarket.com`, then
enable `deploy/nginx-site.conf` as a new Nginx site. Keep Cloudflare proxying
enabled and use Full (strict) encryption.

Change the Cloudflare origin IP only after the new PM2 process and the new
Nginx virtual host pass private tests.
