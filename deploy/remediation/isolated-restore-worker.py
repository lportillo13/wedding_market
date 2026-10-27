#!/usr/bin/env python3
"""Restore the actual application dump inside a transient network-isolated unit."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys

TOOLS=Path('/usr/local/lib/wedding-market-restore17')
BIN=TOOLS/'usr/lib/postgresql/17/bin'
RUNTIME=Path('/run/wm-restore-acceptance')
PHASE='receive encrypted-backup plaintext through private pipe'
DIAGNOSTIC=''

def run(name,args=(),input=None,timeout=60):
    global DIAGNOSTIC
    executable=(Path('/usr/lib/postgresql/17/bin') if name in ('psql','pg_restore') else BIN)/name
    result=subprocess.run([str(executable),*args],input=input,capture_output=True,timeout=timeout)
    if result.returncode:
        text=result.stderr.decode(errors='replace')[-32768:]
        # Only allow generic missing-dependency diagnostics; never COPY rows or query text.
        match=re.search(r'(?:role|schema|extension) "[a-zA-Z0-9_-]{1,63}" (?:does not exist|is not available)',text)
        DIAGNOSTIC=match.group(0) if match else 'isolated-postgres-command-failed'
        raise ValueError('Isolated command failed')
    return result.stdout

def sql(text): return run('psql',['-X','-v','ON_ERROR_STOP=1','-At'],text.encode())

def main():
    global PHASE
    if os.geteuid()==0 or RUNTIME.is_symlink() or not RUNTIME.is_dir(): raise ValueError('Expected transient unprivileged runtime')
    os.umask(0o077)
    archive=RUNTIME/'database.dump'
    size=0
    with archive.open('xb') as output:
        while chunk:=sys.stdin.buffer.read(65536):
            size+=len(chunk)
            if size>64*1024*1024: raise ValueError('Archive exceeds bounded restore')
            output.write(chunk)
    with archive.open('rb') as source:
        if source.read(5)!=b'PGDMP': raise ValueError('Expected PostgreSQL custom archive')
    os.environ.update(PGHOST=str(RUNTIME),PGPORT='55439',PGUSER='postgres',PGDATABASE='postgres',PGCONNECT_TIMEOUT='5',PGOPTIONS='-c statement_timeout=60000')
    data=RUNTIME/'data'
    PHASE='initialize isolated cluster'
    run('initdb',['-D',str(data),'-U','postgres','--auth=trust','--locale=C.UTF-8','--encoding=UTF8','-L',str(TOOLS/'usr/share/postgresql/17')])
    options="-c listen_addresses='' -c unix_socket_directories='"+str(RUNTIME)+"' -c port=55439 -c shared_buffers=32MB -c max_connections=6 -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c jit=off -c dynamic_library_path='"+str(TOOLS/'usr/lib/postgresql/17/lib')+"'"
    run('pg_ctl',['-D',str(data),'-w','-t','20','-l',str(RUNTIME/'server.log'),'-o',options,'start'])
    try:
        PHASE='prepare managed-role placeholders in isolated cluster'
        schema=run('pg_restore',['--schema-only','--no-owner','--file=-',str(archive)]).decode()
        roles={'anon','authenticated','service_role','supabase_auth_admin','supabase_admin','supabase_storage_admin','supabase_functions_admin','dashboard_user','authenticator','pgbouncer'}
        for group in re.findall(r'\b(?:GRANT\b[^;]*\bTO|REVOKE\b[^;]*\bFROM)\s+([^;]+);',schema):
            for role in group.split(','):
                role=role.strip().strip('"')
                if re.fullmatch(r'[a-zA-Z_][a-zA-Z0-9_]{0,62}',role) and role.lower() not in ('public','postgres'):roles.add(role)
        sql(''.join('CREATE ROLE "'+role+'" NOLOGIN;' for role in sorted(roles)))
        PHASE='restore all dumped schemas, data, ACLs and constraints'
        run('pg_restore',['--section=pre-data','--clean','--if-exists','--no-owner','--exit-on-error','--dbname=postgres',str(archive)],timeout=90)
        # A schema-filtered dump does not necessarily include installed extensions.
        # This is the same public pg_trgm dependency as the committed live baseline.
        sql('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;')
        for section in ['data','post-data']:
            run('pg_restore',['--section='+section,'--no-owner','--exit-on-error','--dbname=postgres',str(archive)],timeout=90)
        PHASE='verify restored application and authentication data'
        result=json.loads(sql("SELECT json_build_object('publicTables',(SELECT count(*) FROM pg_tables WHERE schemaname='public'),'authTables',(SELECT count(*) FROM pg_tables WHERE schemaname='auth'),'profiles',(SELECT count(*) FROM public.profiles),'authUsers',(SELECT count(*) FROM auth.users),'migrations',(SELECT count(*) FROM supabase_migrations.schema_migrations),'invalidForeignKeys',(SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname IN ('public','auth') AND c.contype='f' AND NOT c.convalidated),'allPublicTablesHaveRls',(SELECT bool_and(relrowsecurity) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND relkind='r'));"))
        if result['publicTables']<23 or result['authTables']<10 or result['migrations']!=13 or result['invalidForeignKeys']!=0 or result['allPublicTablesHaveRls'] is not True: raise ValueError('Restored invariant failed')
        print(json.dumps({'applicationDumpRestored':True,'authSchemaRestored':True,'restoreAclErrors':False,'constraintsVerified':True,'counts':result,'databaseBytes':size,'productionConnectionUsed':False,'networkAvailable':False,'managedSupabaseServicesTested':False}))
    finally:
        run('pg_ctl',['-D',str(data),'-m','immediate','-w','-t','10','stop'],timeout=15)

if __name__=='__main__':
    try: main()
    except Exception:
        print(json.dumps({'applicationDumpRestored':False,'phase':PHASE,'reason':DIAGNOSTIC or 'bounded-restore-check-failed','productionConnectionUsed':False}))
        raise SystemExit(1)
