import {readFile, writeFile} from 'node:fs/promises';
import {authEmailDefinitions, renderAuthEmail} from './lib/auth-email-templates.mjs';

for (const definition of authEmailDefinitions) {
  const target = new URL(`../supabase/templates/${definition.file}`, import.meta.url);
  const content = renderAuthEmail(definition) + '\n';
  if (process.argv.includes('--check')) {
    if (await readFile(target,'utf8') !== content) throw new Error(`Regenerate stale email template: ${definition.file}`);
  } else await writeFile(target, content);
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${authEmailDefinitions.length} Editorial A authentication and security email templates.`);
