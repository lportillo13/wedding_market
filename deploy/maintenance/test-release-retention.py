import importlib.util
import json
import os
from pathlib import Path
import tempfile
import time
import unittest

spec = importlib.util.spec_from_file_location('retention', Path(__file__).with_name('owner-release-retention.py'))
# fcntl is Linux-only; tests exercise the pure planner on Windows too.
try:
    import fcntl
except ModuleNotFoundError:
    import sys
    import types
    sys.modules['fcntl'] = types.ModuleType('fcntl')
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)


class RetentionTests(unittest.TestCase):
    def test_preserves_active_rollback_dirty_recent_processes_and_unmanaged_paths(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            entries = []
            now = time.time()
            for index in range(7):
                entry = root / f'20261020-00000{index}-{index:012x}'
                entry.mkdir()
                os.utime(entry, (now-172800, now-172800))
                entries.append(entry)
            (root / 'unfinished-work').mkdir()
            os.utime(entries[4], (now, now))
            receipt = {'applicationDeployed': True, 'step': 'complete', 'releaseCommit': '0'*40, 'rollbackCopy': str(entries[1])}
            def inspect(path):
                index = entries.index(path)
                return f'{index:012x}'+'0'*28, index == 3
            candidates, skipped = retention.plan(root, entries[0], receipt, now, inspect, lambda path: path == entries[5])
            self.assertEqual(candidates, [entries[2], entries[6]])
            self.assertEqual(len(skipped), 3)
            receipt['releaseCommit'] = 'f'*40
            with self.assertRaises(ValueError):
                retention.plan(root, entries[0], receipt, now, inspect, lambda path: False)
            receipt['applicationDeployed'] = False
            with self.assertRaises(ValueError):
                retention.plan(root, entries[0], receipt, now, inspect, lambda path: False)


if __name__ == '__main__':
    unittest.main()
