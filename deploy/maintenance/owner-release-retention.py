#!/usr/bin/env python3
"""Owner-installed Wedding Market build retention. Dry run unless --apply is supplied."""
import argparse
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time

ROOT = Path('/var/www/wedding-market-releases')
APP = Path('/var/www/wedding-market')
RECEIPT = Path('/home/wm-audit-20261019/owner-deploy-results.json')
LOCK = Path('/var/backups/wedding-market-deploy/gateway-execution.lock')
NAME = re.compile(r'^\d{8}-\d{6}-([a-f0-9]{12})$')


def plan(root, active, receipt, now, inspect, in_use):
    """Fail closed; preserve the active release, verified rollback and unfinished source."""
    root = root.resolve(strict=True)
    active = active.resolve(strict=True)
    if not receipt.get('applicationDeployed') or receipt.get('step') != 'complete':
        raise ValueError('No successful deployment receipt')
    commit = receipt.get('releaseCommit', '')
    if not re.fullmatch('[a-f0-9]{40}', commit) or not active.name.endswith('-' + commit[:12]):
        raise ValueError('Active release does not match receipt')
    rollback = Path(receipt['rollbackCopy']).resolve(strict=True)
    if rollback == active:
        raise ValueError('Rollback resolves to active release')
    # Rollback can be the original checkout outside ROOT; it is always preserved.
    keep = {active, rollback}
    candidates, skipped = [], []
    for entry in sorted(root.iterdir()):
        match = NAME.fullmatch(entry.name)
        if not match or entry.is_symlink() or not entry.is_dir():
            continue
        resolved = entry.resolve(strict=True)
        if resolved.parent != root or resolved in keep:
            continue
        reason = None
        if now - entry.stat().st_mtime < 86400:
            reason = 'less than 24 hours old'
        elif in_use(resolved):
            reason = 'process still uses release'
        else:
            head, dirty = inspect(resolved)
            if not head.startswith(match.group(1)) or dirty:
                reason = 'revision mismatch or unfinished source'
        if reason:
            skipped.append({'name': entry.name, 'reason': reason})
        else:
            candidates.append(resolved)
    return candidates, skipped


def inspect_git(path):
    def git(*args):
        result = subprocess.run(['/usr/sbin/runuser', '-u', 'deploy', '--', '/usr/bin/git', '-C', str(path), *args],
                                check=True, capture_output=True, text=True, timeout=20)
        return result.stdout.strip()
    return git('rev-parse', 'HEAD'), bool(git('status', '--porcelain', '--untracked-files=normal'))


def process_uses(path):
    for process in Path('/proc').iterdir():
        if process.name.isdecimal():
            try:
                cwd = (process / 'cwd').resolve(strict=True)
                if cwd == path or path in cwd.parents:
                    return True
            except (FileNotFoundError, PermissionError, ProcessLookupError):
                continue
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if os.geteuid() != 0:
        raise SystemExit('Run from the owner root terminal; the audit account needs no additional sudo rule.')
    if not shutil.rmtree.avoids_symlink_attacks:
        raise SystemExit('Safe directory removal is unavailable')
    with LOCK.open('a') as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        receipt = json.loads(RECEIPT.read_text())
        candidates, skipped = plan(ROOT, APP, receipt, time.time(), inspect_git, process_uses)
        deleted = []
        for path in candidates:
            # Recheck mutable state immediately before each removal while holding the deployment lock.
            fresh, _ = plan(ROOT, APP, json.loads(RECEIPT.read_text()), time.time(), inspect_git, process_uses)
            if path not in fresh:
                raise RuntimeError('Retention plan changed')
            if args.apply:
                shutil.rmtree(path)
                deleted.append(path.name)
        print(json.dumps({'apply': args.apply, 'eligible': [p.name for p in candidates], 'deleted': deleted, 'skipped': skipped}))


if __name__ == '__main__':
    main()
