"""Synthetic tests only: no root access, passwords or network required."""
import contextlib
import io
import json
from pathlib import Path
import runpy
from types import SimpleNamespace
from unittest.mock import patch

check = runpy.run_path(str(Path(__file__).with_name('owner-check-database-connection.py')))['main']
project = 'aousexbvujjnvbudpsmz'
password = 'synthetic-not-a-real-password'
for mode in ['success', 'rejected-password', 'placeholder', 'wrong-project']:
    host = 'db.' + ('different-project' if mode == 'wrong-project' else project) + '.supabase.co'
    uri = 'postgresql://postgres:' + ('[YOUR-PASSWORD]' if mode == 'placeholder' else password) + '@' + host + ':5432/postgres'
    calls = []
    def query(args, **kwargs):
        calls.append(args)
        assert password not in ' '.join(args)
        assert args[-1] == '--command=SELECT 1'
        assert kwargs['env']['PGSSLMODE'] == 'verify-full'
        assert 'default_transaction_read_only=on' in kwargs['env']['PGOPTIONS']
        assert kwargs['timeout'] == 25
        return SimpleNamespace(returncode=1 if mode == 'rejected-password' else 0,
                               stdout='' if mode == 'rejected-password' else '1\n',
                               stderr='password authentication failed: ' + password if mode == 'rejected-password' else '')
    output = io.StringIO()
    with patch('os.geteuid', return_value=0, create=True), patch('os.isatty', return_value=True), \
         patch('getpass.getpass', return_value=uri), patch.object(Path, 'is_file', return_value=True), \
         patch.object(Path, 'is_symlink', return_value=False), patch('subprocess.run', side_effect=query), \
         contextlib.redirect_stdout(output):
        if mode == 'wrong-project':
            try: check()
            except ValueError: pass
            else: raise AssertionError('Foreign database must be rejected')
        else:
            result = check()
            report = json.loads(output.getvalue())
            assert report['connected'] == (mode == 'success')
            assert (result == 0) == (mode == 'success')
        assert password not in output.getvalue() and uri not in output.getvalue()
        assert bool(calls) == (mode in ['success', 'rejected-password'])
print('PASS: scoped read-only connection, strict TLS, no credential arguments/output, placeholder and foreign-project rejection.')
