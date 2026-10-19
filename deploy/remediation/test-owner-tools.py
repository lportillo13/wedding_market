#!/usr/bin/env python3
"""Synthetic credential-tool regression checks; no network or real PM2 calls."""
import base64
import contextlib
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
from types import SimpleNamespace
from unittest.mock import patch


def main():
    script = Path(__file__).with_name('owner-service-key.py')
    payload = base64.urlsafe_b64encode(json.dumps({'role': 'service_role', 'ref': 'aousexbvujjnvbudpsmz'}).encode()).decode().rstrip('=')
    synthetic = 'synthetic.' + payload + '.synthetic'
    for mode in ['success', 'wrong-format', 'probe-denied']:
        functions = runpy.run_path(str(script))
        scope = functions['main'].__globals__
        with tempfile.TemporaryDirectory(prefix='wm-synthetic-credential-') as folder:
            app = Path(folder)
            (app / '.next/standalone').mkdir(parents=True)
            paths = [app / '.env.production.local', app / '.next/standalone/.env.production.local']
            for path in paths: path.write_text('EXISTING=synthetic\nSUPABASE_SERVICE_ROLE_KEY=old-synthetic\n')
            calls = []
            results = []
            def fake_command(args, **kwargs):
                calls.append(args)
                if args == ['pm2', 'jlist']:
                    return json.dumps([{'name': 'wedding-market', 'pid': os.getpid(), 'pm2_env': {'env': {'WM_RELEASE_COMMIT': 'synthetic-release'}}}]).encode()
                if '-e' in args:
                    return json.dumps({'ok': mode != 'probe-denied', 'status': 401 if mode == 'probe-denied' else 200}).encode()
                return b''
            scope['APP'] = app
            scope['write_result'] = results.append
            actual_chmod = Path.chmod
            def safe_chmod(path, *args, **kwargs):
                if str(path) == '/home/deploy/.pm2/dump.pm2': return
                return actual_chmod(path, *args, **kwargs)
            with patch('os.geteuid', return_value=0), patch('os.isatty', return_value=True), \
                 patch('pwd.getpwnam', return_value=SimpleNamespace(pw_uid=os.getuid(), pw_gid=os.getgid())), \
                 patch('getpass.getpass', return_value='public-synthetic' if mode == 'wrong-format' else synthetic), \
                 patch('subprocess.check_output', side_effect=fake_command), patch.object(Path, 'chmod', safe_chmod), \
                 contextlib.redirect_stdout(io.StringIO()):
                try: functions['main']()
                except ValueError:
                    assert mode != 'success'
                else: assert mode == 'success'
            if mode == 'success':
                assert results[0]['serviceCredentialProbePassed'] is True
                assert all(('SUPABASE_SERVICE_ROLE_KEY=' + synthetic) in path.read_text() for path in paths)
                assert ['pm2', 'restart', 'wedding-market', '--update-env'] in calls
            else:
                assert all('old-synthetic' in path.read_text() for path in paths)
                assert not any('restart' in call for call in calls)
    print('PASS: synthetic service-key success, rejected key format, denied probe; failed validation preserves environment and process.')
    setup = runpy.run_path(os.environ.get('WM_OWNER_SETUP_TEST_PATH', str(script.with_name('owner-backup-setup.py'))))
    for existing_database in [False, True]:
        with tempfile.TemporaryDirectory(prefix='wm-synthetic-backup-rollback-') as folder:
            private = Path(folder) / 'private'
            private.mkdir()
            tools = Path(folder) / 'tools'
            tools.mkdir()
            (tools / 'marker').write_text('new-runtime')
            previous = Path(folder) / 'previous'
            previous.mkdir()
            (previous / 'marker').write_text('old-runtime')
            config = private / 'database.json'
            if existing_database: config.write_text('old-synthetic-config')
            scope = setup['verify_first_backup'].__globals__
            scope.update(PRIVATE=private, TOOLS=tools)
            with patch('subprocess.run', side_effect=RuntimeError('synthetic backup failure')):
                try: setup['verify_first_backup']({'password':'synthetic'}, previous)
                except RuntimeError: pass
                else: raise AssertionError('Expected synthetic backup failure')
            assert config.read_text() == 'old-synthetic-config' if existing_database else not config.exists()
            assert (tools / 'marker').read_text() == 'old-runtime'
    with tempfile.TemporaryDirectory(prefix='wm-synthetic-runtime-reuse-') as folder:
        source = Path(folder) / 'source'
        tools = Path(folder) / 'tools'
        (source / 'backup-runtime').mkdir(parents=True)
        tools.mkdir()
        for name in ['owner-backup.mjs','backup-streams.mjs','package.json','package-lock.json']:
            target = source / name if name.endswith('.mjs') else source / 'backup-runtime' / name
            target.write_text('synthetic ' + name)
            (tools / name).write_text(target.read_text())
        for name in ['@aws-sdk/client-s3','@next/env']:
            package = tools / ('node_modules/' + name + '/package.json')
            package.parent.mkdir(parents=True)
            package.write_text('{}')
        scope = setup['install_runtime'].__globals__
        scope.update(SOURCE=source, TOOLS=tools)
        with patch('subprocess.run', side_effect=AssertionError('Must not reinstall matching runtime')),contextlib.redirect_stdout(io.StringIO()):
            assert setup['install_runtime']() is None
    print('PASS: failed database backup restores previous configuration/runtime; matching runtime skips npm reinstall.')


if __name__ == '__main__': main()
