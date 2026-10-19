# Assistant-operated deployment setup

Status: installed and verified end to end. The assistant deployed `76a109e7` through the gateway; its detached job, shadow/live probes and independent public checks passed. The preceding public website release was `2f0a556d`.

The owner explicitly requested both "Always deploy the changes" and "I want you to make the deploys." The existing SSH audit identity has no sudo permission, so the owner must install the fixed entry point once. Future ordinary releases use that entry point without another root-terminal handoff. Updates to the privileged helper itself still require the owner.

Source commit: `76a109e77368d11cc1554dd42bd806de9e288906`. All uploaded setup checksums, Linux regressions and installer syntax passed; the exact synthetic sudoers rule passed `visudo -cf` without installation.

| Prepared artifact | SHA256 |
| --- | --- |
| Generated installer | `3510cb33c6dbd9348706aab9b461bd542af16f3ed30aff79a63868f651ce92b8` |
| Root-owned gateway | `0d409208dd932d9fff5fc94f9fe9ea51310d470a63aac00748f5228f1edb9d30` |
| Root-owned deployment helper | `11bb7409dd2b26d640fc2f51e4558290264d05d3214b274f9bcd53b5e66899c6` |

## One-time owner command

```bash
install -m 700 /home/wm-audit-20261019/deployment-setup/install-deployment-gateway.sh /root/wm-install-deploy.sh && printf '%s  %s\n' '3510cb33c6dbd9348706aab9b461bd542af16f3ed30aff79a63868f651ce92b8' /root/wm-install-deploy.sh | sha256sum -c - && bash /root/wm-install-deploy.sh
```

This grants the audit account only `/usr/local/sbin/wedding-market-release`, which accepts one manifest digest. It uses root-owned code, accepts only manifest/bundle data, and queues a fixed detached systemd job. Uploaded helper files cannot replace the privileged executable. Git, Node, dependency/build scripts, PM2 and writes through deploy-controlled paths drop to the existing `deploy` account. The existing shared deploy account is retained; this does not introduce OS-user isolation between applications.

## Setup verification performed

1. Confirm `sudo -n -l` shows the fixed command and verify invalid arguments are rejected without starting a job.
2. The proof release was `76a109e77368d11cc1554dd42bd806de9e288906`, against the then-live base `2f0a556df693d150ff3b10d1ec5a1b631bf06f6d`. Its consumed manifest SHA256 was `de242cf677af53a14dc01b7fc4d19a936443bdff7694acedba0fe82f063abb31`. Do not reuse that manifest: future releases must be regenerated against the independently verified current live commit.
3. Upload only the manifest and bundle to `/home/wm-audit-20261019/deployment-inbox` and invoke `sudo -n /usr/local/sbin/wedding-market-release <manifest-sha256>` through the existing audit SSH identity. A job-accepted response is not deployment completion.
4. Monitor `wedding-market-release.service` and the sanitized `owner-deploy-results.json`. Require the exact target commit, `applicationDeployed: true`, successful shadow/live probes and independent public checks. Update the context/receipt with actual installed and deployed status.

The existing audit private key remains outside the repository under the current chat's `audit-access` visualization directory. Never include its contents or credential-bearing process configuration in notes. Remove `/etc/sudoers.d/wedding-market-release` to revoke the entry point; retain normal owner SSH access and running application state.

## Installed access and first assistant-started release

The owner confirmed installation. `sudo -n -l` independently showed exactly the fixed release command as NOPASSWD; no other sudo command was listed. An actual invocation with invalid arguments returned the expected rejection and exit status 1 without starting a deployment.

The assistant uploaded only the reviewed manifest and bundle, then invoked the installed gateway with digest `de242cf677af53a14dc01b7fc4d19a936443bdff7694acedba0fe82f063abb31`. It accepted target commit `76a109e77368d11cc1554dd42bd806de9e288906` and queued `wedding-market-release.service`, independent of the SSH connection. The service completed with exit status 0. [assistant-deployment-success.json](assistant-deployment-success.json) records the exact commit, `applicationDeployed: true` and ten passing checks on each shadow/live target. The active symlink resolved to `/var/www/wedding-market-releases/20261019-213949-76a109e77368`; rollback is preserved at `/var/www/wedding-market.before-20261019-213949`.

[assistant-public-release-checks.json](assistant-public-release-checks.json) independently confirms public pages/directory, new header markup, security headers and anonymous API guards. Direct-origin HTTPS still returned 403. Local ignored `.cache/deployment-connection.json` stores connection paths and installed digests without key contents; it is not part of the release or repository.
