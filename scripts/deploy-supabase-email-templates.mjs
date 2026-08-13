import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const templatesDirectory = path.join(projectDirectory, "supabase", "templates");

const templateDefinitions = [
  ["confirmation", "Confirm your email | The Wedding Market", "confirmation.html"],
  ["recovery", "Reset your password | The Wedding Market", "recovery.html"],
  ["invite", "You are invited | The Wedding Market", "invite.html"],
  ["magic_link", "Your secure sign-in link | The Wedding Market", "magic-link.html"],
  ["email_change", "Confirm your new email | The Wedding Market", "email-change.html"],
  ["reauthentication", "Your verification code | The Wedding Market", "reauthentication.html"],
];

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
    templateDefinitions.map(async ([type, subject, fileName]) => {
      const content = await readFile(path.join(templatesDirectory, fileName), "utf8");
      return [
        [`mailer_subjects_${type}`, subject],
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
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await buildPayload()),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Supabase rejected the email template update (${response.status}): ${responseText.slice(0, 500)}`
    );
  }

  console.log(`Deployed ${templateDefinitions.length} branded Auth email templates to ${projectRef}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
