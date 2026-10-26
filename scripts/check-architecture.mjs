import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import ts from 'typescript';

const root = process.cwd();
const directories = ['app', 'features', 'lib', 'components', 'shared', 'mobile/src'];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name).replaceAll('\\', '/');
  return entry.isDirectory() ? walk(file) : /\.tsx?$/.test(file) ? [file] : [];
});
const files = directories.flatMap(walk);
const modules = new Map();
const errors = [];
const resolve = (file, specifier) => {
  const base = specifier.startsWith('@/') ? specifier.slice(2) : specifier.startsWith('.') ? path.relative(root, path.resolve(path.dirname(file), specifier)).replaceAll('\\', '/') : null;
  return base ? [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(candidate => files.includes(candidate)) : null;
};
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const directives = source.statements.filter(node => ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression)).map(node => node.expression.text);
  const imports = [];
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
    if (node.isTypeOnly || node.importClause?.isTypeOnly) continue;
    const bindings = node.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings) && bindings.elements.length && bindings.elements.every(element => element.isTypeOnly) && !node.importClause.name) continue;
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
  }
  modules.set(file, { file, lines: content.split('\n').length, directives, imports, dependencies: imports.map(specifier => resolve(file, specifier)).filter(Boolean) });
}
const serverFile = file => /^features\/[^/]+\/server\//.test(file) || /^lib\/(?:admin\/|supabase\/(?:server|admin|request)\.ts|r2\.ts|resend\.ts)/.test(file);
for (const module of modules.values()) {
  if (module.file.startsWith('shared/')) {
    for (const dependency of module.dependencies) if (!dependency.startsWith('shared/')) errors.push(`${module.file}: shared code depends on ${dependency}`);
    for (const specifier of module.imports) if (!specifier.startsWith('.') && !specifier.startsWith('@/shared/')) errors.push(`${module.file}: shared code imports runtime package ${specifier}`);
  }
  if (module.file.startsWith('mobile/src/') && module.lines > 1000) errors.push(`${module.file}: ${module.lines} lines exceeds the native module limit`);
  if (module.file.startsWith('mobile/src/')) for (const dependency of module.dependencies) if (!dependency.startsWith('mobile/src/') && !dependency.startsWith('shared/')) errors.push(`${module.file}: native code crosses into ${dependency}`);
  if (module.directives.includes('use client')) {
    const queue = [...module.dependencies], visited = new Set();
    while (queue.length) {
      const dependency = queue.pop();
      if (visited.has(dependency)) continue;
      visited.add(dependency);
      const target = modules.get(dependency);
      if (target.directives.includes('use server')) continue; // Next.js server action boundary.
      if (serverFile(dependency)) errors.push(`${module.file}: client runtime reaches server module ${dependency}`);
      else queue.push(...target.dependencies);
    }
  }
}
// Detect cycles in the new feature/shared/native layers, including compatibility bridges.
const active = new Set(), complete = new Set();
function visit(file, chain = []) {
  if (complete.has(file)) return;
  if (active.has(file)) { errors.push('Circular dependency: ' + [...chain.slice(chain.indexOf(file)), file].join(' -> ')); return; }
  active.add(file);
  for (const dependency of modules.get(file).dependencies) visit(dependency, [...chain, file]);
  active.delete(file);
  complete.add(file);
}
for (const file of modules.keys()) if (/^(?:features|shared|mobile\/src)\//.test(file)) visit(file);
if (fs.readFileSync('mobile/App.tsx', 'utf8').split('\n').length > 10) errors.push('mobile/App.tsx must remain a thin Expo entry point');
const migrations = fs.readdirSync('supabase/migrations').filter(name => name.endsWith('.sql')).sort();
if (migrations.some(name => !/^\d{12,14}_[a-z0-9_]+\.sql$/.test(name)) || new Set(migrations.map(name => name.split('_')[0])).size !== migrations.length) errors.push('Migration filenames must have unique ordered numeric versions');
const report = { checkedAt: new Date().toISOString(), passed: errors.length === 0, checkedModules: modules.size, migrations: migrations.length, largestNativeModules: [...modules.values()].filter(module => module.file.startsWith('mobile/')).sort((a, b) => b.lines - a.lines).slice(0, 6).map(({ file, lines }) => ({ file, lines })), errors };
fs.mkdirSync('.cache/restructure-2026-10-26', { recursive: true });
fs.writeFileSync('.cache/restructure-2026-10-26/architecture-check.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
