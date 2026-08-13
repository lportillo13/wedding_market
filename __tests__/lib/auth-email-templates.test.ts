import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const templates = [
  ["confirmation.html", ".ConfirmationURL"],
  ["recovery.html", ".ConfirmationURL"],
  ["invite.html", ".ConfirmationURL"],
  ["magic-link.html", ".ConfirmationURL"],
  ["email-change.html", ".ConfirmationURL"],
  ["reauthentication.html", ".Token"],
] as const;

test("all Supabase Auth emails use the branded responsive template", () => {
  for (const [fileName, requiredVariable] of templates) {
    const html = readFileSync(path.join(process.cwd(), "supabase", "templates", fileName), "utf8");

    assert.match(html, /THE/);
    assert.match(html, /WEDDING MARKET/);
    assert.match(html, /#b8922a/);
    assert.match(html, /@media\(max-width:620px\)/);
    assert.match(html, /\.Data\.language/);
    assert.ok(html.includes(`{{ ${requiredVariable} }}`), `${fileName} must include {{ ${requiredVariable} }}`);
  }
});
