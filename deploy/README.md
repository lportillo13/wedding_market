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

## Nginx and Cloudflare

The domain uses Cloudflare nameservers and proxied DNS. Install a Cloudflare
Origin CA certificate for `thewedmarket.com` and `*.thewedmarket.com`, then
enable `deploy/nginx-site.conf` as a new Nginx site. Keep Cloudflare proxying
enabled and use Full (strict) encryption.

Change the Cloudflare origin IP only after the new PM2 process and the new
Nginx virtual host pass private tests.
