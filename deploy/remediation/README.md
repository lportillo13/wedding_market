# Wedding Market owner rollout

These tools are scoped to Wedding Market on 89.167.111.168. They require the owner's existing root terminal; the audit SSH user has no sudo access. Review the source before execution. No script prints credentials or customer records. Paid Hetzner backups stay disabled.

## Deployment

`owner-deploy.py --manifest-sha <reviewed SHA256>` verifies the manifest, tools and Git bundle, rejects drift from the audited production commit, and checks RAM and free disk. It builds as the existing `deploy` user in a separate release directory while the current process stays up. A shadow server on loopback port 3012 must pass health, directory, authorization and header checks before the script switches `/var/www/wedding-market` and only its named PM2 process. A brief interruption is possible during the PM2 switch. An unsuccessful live check restores the prior path and process configuration. The complete prior checkout, including its uncommitted patch files and environment, is preserved at `/var/www/wedding-market.before-<UTC timestamp>`.

The release uses Next standalone output, loopback port 3001, a 1,500 MB PM2 restart threshold, and the existing supported Node executable. It changes the media URL to the verified active custom domain while accepting the former configured r2.dev URL. Private environment files remain mode 600. Build logs and rollback configuration stay under root-only `/var/backups/wedding-market-deploy`.

The sanitized result is `/home/wm-audit-20261019/owner-deploy-results.json`. A successful return is required before applying database migrations 202610190004 and 202610190005. The owner must enroll their own admin authenticator; no assistant should view the QR code or recovery credentials.

## Origin restrictions

`owner-origin-hardening.py` changes only the Wedding Market Nginx site and dedicated include files. It fetches current ranges from Cloudflare's official HTTPS endpoints, validates each network, and allows those sources plus loopback. The ACME challenge path stays outside the restriction. API requests forwarded by Cloudflare are limited to five per second per visitor, with a burst of 20; ordinary pages and static assets are not rate limited. An existing global real-IP rewrite or changed site layout causes a safe stop for review.

The tool saves the old site, validates `nginx -t`, and reloads. Configuration failure restores the original. After execution, verify the public domain in a browser, the direct-origin rejection from outside the server, and a certificate renewal dry run. Restore the saved site and remove the two named include files if public availability fails; validate and reload Nginx. IP restrictions block ordinary direct-origin bypass; Cloudflare source ranges are shared and do not authenticate a particular zone. Per-host authenticated origin pulls remain a stronger future control.

Official references: [Cloudflare source ranges](https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/), [Nginx access rules](https://nginx.org/en/docs/http/ngx_http_access_module.html), [Nginx request limiting](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html).

## Service credential repair

Run `owner-service-key.py` only after the new application is verified. Copy the correct project service credential yourself into its hidden prompt in the root terminal. Never paste a credential into chat. The script checks the expected project/key format and performs an authenticated HEAD request with zero rows using the installed Supabase SDK. Only after this succeeds does it update the selected service-role variable in the two Wedding Market environment files and restart its PM2 process. The result file contains booleans only.

The existing R2 credential has broad scope. Creating or changing credentials in the dashboard requires the owner. Replace it with a token restricted to the Wedding Market bucket, verify upload and deletion of a disposable owned asset, then revoke the superseded token only after identifying its consumers.

## Recovery and later deployments

Do not treat a preserved checkout as a database or object backup. Paid server backups were declined. Database and R2 recovery work is tracked as open in the remediation status until actual encrypted copies and recovery checks succeed.

The historical `/home/deploy/deploy-wm.sh` expects an in-place deployment. Review it before future use: this release runs `.next/standalone/server.js`, and standalone releases need `public`, `.next/static` and the private production environment copied into their output. Do not run a generic deploy script that replaces the environment or starts Docker/Supabase on the shared host. Future deployments should build a separate release and use the same probe-and-switch procedure with a newly reviewed expected base commit.
