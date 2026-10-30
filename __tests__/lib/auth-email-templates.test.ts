import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const templates = [
  ["confirmation.html", ".ConfirmationURL"],
  ["recovery.html", ".TokenHash"],
  ["invite.html", ".ConfirmationURL"],
  ["magic-link.html", ".ConfirmationURL"],
  ["email-change.html", ".ConfirmationURL"],
  ["reauthentication.html", ".Token"],
  ["password-changed.html", ".SiteURL"],
  ["email-changed.html", ".SiteURL"],
  ["phone-changed.html", ".SiteURL"],
  ["identity-linked.html", ".SiteURL"],
  ["identity-unlinked.html", ".SiteURL"],
  ["mfa-factor-enrolled.html", ".SiteURL"],
  ["mfa-factor-unenrolled.html", ".SiteURL"],
] as const;

test("all Supabase Auth emails use the branded responsive template", () => {
  for (const [fileName, requiredVariable] of templates) {
    const html = readFileSync(path.join(process.cwd(), "supabase", "templates", fileName), "utf8");

    assert.match(html, /WEDDING MARKET/);
    assert.match(html, /#faf8f4/);
    assert.match(html, /#332d27/);
    assert.doesNotMatch(html, /#b8922a|>THE<|The Wedding Market/);
    assert.match(html, /mailto:hello@thewedmarket\.com/);
    assert.match(html, /@media\(max-width:620px\)/);
    assert.match(html, /\.Data\.language/);
    assert.ok(html.includes(`{{ ${requiredVariable} }}`), `${fileName} must include {{ ${requiredVariable} }}`);
  }
});

test("password recovery always opens the web reset flow", () => {
  const html = readFileSync(
    path.join(process.cwd(), "supabase", "templates", "recovery.html"),
    "utf8",
  );

  assert.ok(
    html.includes(
      "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password",
    ),
  );
  assert.doesNotMatch(html, /\.ConfirmationURL/);
});
