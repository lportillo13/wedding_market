import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authEmailDefinitions } from './lib/auth-email-templates.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const templatesDirectory = path.join(projectDirectory, "supabase", "templates");


function getProjectRef() {
  const explicit = process.env.SUPABASE_PROJECT_REF?.trim();
  if (explicit) {
    return explicit;
  }

  const projectUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  if (projectUrl) {
    try {
      const host = new URL(projectUrl).hostname;
      const suffix = ".supabase.co";
      if (host.endsWith(suffix)) {
        return host.slice(0, -suffix.length);
      }
    } catch {
      // The validation error below gives the user one consistent recovery path.
    }
  }

  throw new Error(
    "Missing SUPABASE_PROJECT_REF. Set it to the project reference shown in the Supabase project URL."
  );
}

async function buildPayload() {
  const entries = await Promise.all(
    authEmailDefinitions.map(async ({type, subject, file: fileName}) => {
      const content = await readFile(path.join(templatesDirectory, fileName), "utf8");
      return [
        [`mailer_subjects_${type}`, `${subject} | Wedding Market`],
        [`mailer_templates_${type}_content`, content],
      ];
    })
  );

  return Object.fromEntries(entries.flat());
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error(
      "Missing SUPABASE_ACCESS_TOKEN. Create a personal access token at https://supabase.com/dashboard/account/tokens and export it before running this command."
    );
  }

  const projectRef = getProjectRef();
  if (!/^[a-z0-9]{20}$/.test(projectRef)) throw new Error('Invalid Supabase project reference.');
  const payload = await buildPayload();
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const headers = {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'};
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Supabase rejected the email template update (${response.status}); provider response suppressed.`);
  }

  const verification = await fetch(endpoint, {headers, signal:AbortSignal.timeout(30000)});
  if (!verification.ok) throw new Error(`Template readback failed (${verification.status}).`);
  const actual = await verification.json();
  if (!Object.entries(payload).every(([key,value]) => actual[key] === value)) throw new Error('Hosted template readback differs; publication is not verified.');
  console.log(`Published and read back ${authEmailDefinitions.length} Editorial A Auth/security email templates. Notification enablement and SMTP credentials unchanged.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
