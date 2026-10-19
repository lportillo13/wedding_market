"""Audit tracked files and old environment blobs without printing secret values."""
import base64
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path.cwd()
OUT = ROOT / 'docs/audit-2026-10-19'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

findings = []
patterns = {
    'openai_key': r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{25,}',
    'supabase_secret': r'\bsb_secret_[A-Za-z0-9_-]{20,}',
    'resend_key': r'\bre_[A-Za-z0-9]{25,}',
    'jwt': r'\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}',
    'database_url_with_password': r'postgres(?:ql)?://[^\s:/]+:[^\s@]+@[^\s"\x27]+',
}

def inspect(text, path, revision='working-tree'):
    for kind, pattern in patterns.items():
        for match in re.finditer(pattern, text):
            value = match.group(0)
            detail = kind
            if kind == 'jwt':
                try:
                    payload = match.group(0).split('.')[1]
                    claims = json.loads(base64.urlsafe_b64decode(payload+'='*(-len(payload)%4)))
                    detail = 'jwt_role_' + str(claims.get('role', 'unspecified'))
                except Exception:
                    continue
            findings.append({'path':path,'revision':revision,'line':text.count('\n',0,match.start())+1,'kind':detail,'fingerprint':hashlib.sha256(value.encode()).hexdigest()[:12]})

files = git('ls-files','-z').decode().split('\0')
for name in filter(None,files):
    p = ROOT/name
    if not p.is_file() or p.stat().st_size > 5_000_000:
        continue
    try:
        inspect(p.read_text(encoding='utf-8'),name)
    except (UnicodeError,OSError):
        pass

history_paths = ['.env','.env.local','.env.production','.env.production.local']
history_commits = git('log','--all','--format=%H','--',*history_paths).decode().splitlines()
for revision in history_commits:
    for name in history_paths:
        proc = subprocess.run(['git','show',f'{revision}:{name}'],cwd=ROOT,capture_output=True)
        if proc.returncode == 0:
            inspect(proc.stdout.decode('utf-8',errors='replace'),name,revision[:12])

snapshot = json.loads((ROOT/'schema/supabase-schema.json').read_text(encoding='utf-8'))
tables = snapshot.get('public',{})
schema_summary = []
for name,table in tables.items():
    schema_summary.append({'name':name,'kind':table['kind'],'columns':len(table.get('columns',[])),'indexes':table.get('indexes',[]),'constraints':table.get('constraints',[])})

dump = (ROOT/'supabase-local-dump.sql').read_text(encoding='utf-8')
views=[]
for match in re.finditer(r'CREATE(?: OR REPLACE)? VIEW\s+"public"\."([^"]+)"(.*?);',dump,re.S):
    views.append({'name':match.group(1),'definition':match.group(0),'line':dump.count('\n',0,match.start())+1})
policies=[]
for match in re.finditer(r'CREATE POLICY\s+"([^"]+)" ON "public"\."([^"]+)"(.*?);',dump,re.S):
    policies.append({'table':match.group(2),'name':match.group(1),'definition':match.group(0),'line':dump.count('\n',0,match.start())+1})

output={'scope':'local tracked files and local historical schema; not a production database inspection','tracked_files':len(list(filter(None,files))),'environment_history_commits':len(history_commits),'credential_findings':findings,'schema':schema_summary,'views':views,'policies':policies}
(OUT/'repository-scan.json').write_text(json.dumps(output,indent=2),encoding='utf-8')
print(json.dumps({'tracked_files':output['tracked_files'],'environment_history_commits':len(history_commits),'credential_findings':findings,'schema_objects':len(schema_summary),'views':len(views),'policies':len(policies)},indent=2))
