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
  ["email-changed.html", ".OldEmail"],
  ["phone-changed.html", ".OldPhone"],
  ["identity-linked.html", ".Provider"],
  ["identity-unlinked.html", ".Provider"],
  ["mfa-factor-enrolled.html", ".FactorType"],
  ["mfa-factor-unenrolled.html", ".FactorType"],
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

test('new and returning email-code accounts receive branded codes without losing their confirmation links',()=>{
  for(const file of ['confirmation.html','magic-link.html']){
    const html=readFileSync(path.join(process.cwd(),'supabase','templates',file),'utf8');
    assert.ok(html.includes('{{ .Token }}'));
    assert.ok(html.includes('{{ .ConfirmationURL }}'));
    assert.match(html,/font-size:32px/);
  }
});
