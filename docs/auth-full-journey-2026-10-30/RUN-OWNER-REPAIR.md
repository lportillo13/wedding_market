# Owner Nginx repair

Status: applied by the owner on October 30, 2026; independently verified. The protected backup is `/var/backups/wedding-market-auth-proxy/20261030-181755`. The checked command below is retained as an execution record.

The fixed release gateway cannot edit Nginx. This repair changes only Wedding Market's site file, adds 32 KiB auth response-header capacity, preserves origin restrictions and caching policy, backs up the file, validates Nginx and restores the original on failure. DW configuration, PM2, credentials and database records are untouched.

Six isolated tests pass, including log filtering. The owner-run script reads a bounded 15-minute Wedding Market callback log summary and applies the repair only when a header overflow is confirmed. Otherwise it leaves configuration untouched. Raw logs, cookies and authentication codes are never printed. A read-only preflight against the live site confirms that only the three intended buffer directives would be added. No production configuration was changed during preparation.

The authenticated browser received two 502s while anonymous routes worked; normal sign-out restored the browser. The response-header budget is a suspected cause, not a confirmed log diagnosis: audit access cannot read the gateway error log. An isolated SDK test with fictional Google-shaped metadata produces a callback response header object of 7,980 bytes and refresh proxy header object of 11,604 bytes, before Next.js removes internal middleware headers. See [Nginx buffer documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffer_size). Actual provider callbacks must be rechecked after the repair.

The command copies the reviewed file to root-owned storage and verifies its exact digest before executing it. The expected live site hash also prevents a stale patch.

```sh
install -m 700 /home/wm-audit-20261019/auth-proxy-repair/fix-auth-proxy-buffers.py /root/wm-auth-proxy-fix.py && echo '3ac6ea7ffbb7271b7b8bf1bcb99b6086b1b2a660c23fd119d3bb76deaaeb264d  /root/wm-auth-proxy-fix.py' | sha256sum -c - && python3 /root/wm-auth-proxy-fix.py --apply --expected-site-sha256 f7e92b11371bf2eac2e061022d4cc322318ba70af9cef4128964844bc6b0f0b2
```

Save the printed backup path. A successful result reports nginxValidatedAndReloaded: true. The assistant must independently re-read the configured buffers and repeat the failing authenticated route/provider tests.
