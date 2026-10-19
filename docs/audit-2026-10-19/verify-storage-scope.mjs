import fs from 'node:fs';
import vm from 'node:vm';
import console from 'node:console';
import ts from 'typescript';
const source = fs.readFileSync('lib/r2.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 } }).outputText;
const exportsObject = {};
const context = {
  exports:exportsObject,
  require(name) {
    if(name === '@aws-sdk/client-s3') return {};
    throw new Error(`Unexpected module ${name}`);
  },
  process:{env:{R2_BUCKET:'audit-only-bucket',R2_PUBLIC_BASE_URL:'https://assets.audit.invalid'}},
};
vm.runInNewContext(compiled,context,{timeout:1000});
const checks = [
  {description:'URL on configured host pointing outside the current user namespace',url:'https://assets.audit.invalid/vendors/other-vendor/logo/example.webp'},
  {description:'URL on a different R2 host',url:'https://different-account.r2.dev/vendors/other-vendor/logo/example.webp'},
].map(check=>({description:check.description,resolvedKey:exportsObject.getR2ObjectKeyFromUrl(check.url),matchesExpectedClientNamespace:exportsObject.getR2ObjectKeyFromUrl(check.url)?.startsWith('clients/audit-user/avatar/') ?? false}));
const output = {scope:'Isolated execution of URL parsing only. No real configuration, network calls, uploads, or deletes.',checks};
fs.writeFileSync('docs/audit-2026-10-19/storage-scope-check.json',JSON.stringify(output,null,2));
console.log(JSON.stringify(output,null,2));
