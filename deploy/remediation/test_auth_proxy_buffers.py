import importlib.util
import datetime
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('wm_auth_proxy', Path(__file__).with_name('fix-auth-proxy-buffers.py'))
repair = importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)

SOURCE = '''server {
    server_name thewedmarket.com www.thewedmarket.com;
    location / {
        include /etc/nginx/snippets/wedding-market-cloudflare.conf;
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
    }
}
'''


class ProxyBufferTests(unittest.TestCase):
    def test_changes_only_buffer_directives(self):
        updated = repair.patch_site(SOURCE)
        self.assertEqual(updated.replace('\n        ' + repair.BLOCK, ''), SOURCE)
        self.assertIn('proxy_buffer_size 32k;', updated)
        self.assertIn('proxy_buffers 4 32k;', updated)
        self.assertIn('proxy_busy_buffers_size 64k;', updated)

    def test_repeat_is_idempotent(self):
        updated = repair.patch_site(SOURCE)
        self.assertEqual(repair.patch_site(updated), updated)

    def test_rejects_other_hosts_and_upstreams(self):
        for source in [SOURCE.replace('thewedmarket.com www.thewedmarket.com', 'dw.example.invalid'),
                       SOURCE.replace('3001;', '3000;'), SOURCE + SOURCE]:
            with self.subTest(source=source), self.assertRaises(ValueError):
                repair.patch_site(source)

    def test_preserves_review_for_existing_custom_buffers(self):
        with self.assertRaises(ValueError):
            repair.patch_site(SOURCE.replace(repair.ANCHOR, repair.ANCHOR + '\n proxy_buffer_size 8k;'))

    def test_diagnosis_requires_recent_wedding_market_callback_errors(self):
        rows = [
            '2026/10/30 18:13:00 [error] upstream sent too big header, host: thewedmarket.com, request: GET /auth/callback?code=synthetic',
            '2026/10/30 18:13:00 [error] upstream timed out, host: thewedmarket.com, request: GET /auth/callback?code=synthetic',
            '2026/10/30 18:13:00 [error] upstream sent too big header, host: dw.example.invalid, request: GET /auth/callback',
            '2026/10/30 18:13:00 [error] upstream sent too big header, host: thewedmarket.com, request: GET /blog',
            '2026/10/30 17:30:00 [error] upstream sent too big header, host: thewedmarket.com, request: GET /auth/callback',
        ]
        counts = repair.auth_gateway_errors('\n'.join(rows), datetime.datetime(2026, 10, 30, 18, 15))
        self.assertEqual(counts, {'authHeaderTooBig': 1, 'authTimeouts': 1, 'authConnectionFailures': 0})
        self.assertNotIn('synthetic', str(counts))

    def test_no_matching_log_cannot_confirm_header_overflow(self):
        counts = repair.auth_gateway_errors('unrelated data', datetime.datetime(2026, 10, 30, 18, 15))
        self.assertEqual(counts['authHeaderTooBig'], 0)


if __name__ == '__main__':
    unittest.main()
