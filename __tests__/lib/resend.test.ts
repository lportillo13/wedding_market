import assert from "node:assert/strict";
import test from "node:test";
import { escapeEmailHtml, renderTransactionalEmail } from "../../lib/resend";

test("escapes untrusted values in transactional email HTML", () => {
  assert.equal(
    escapeEmailHtml(`<img src=x onerror="alert('x')">`),
    "&lt;img src=x onerror=&quot;alert(&#039;x&#039;)&quot;&gt;"
  );

  const html = renderTransactionalEmail({
    preview: "A <new> reply",
    title: "New quote & reply",
    body: "Vendor <b>name</b>",
    detail: "<script>bad()</script>",
    actionLabel: "View conversation",
    actionUrl: "https://thewedmarket.com/account/inbox/a?x=1&y=2",
  });

  assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /Vendor &lt;b&gt;name&lt;\/b&gt;/);
  assert.match(html, /x=1&amp;y=2/);
  assert.match(html, /THE/);
  assert.match(html, /WEDDING MARKET/);
  assert.match(html, /#b8922a/);
  assert.match(html, /MESSAGE PREVIEW/);
  assert.match(html, /thewedmarket\.com\/privacy/);
});

test("renders localized email chrome and rejects unsafe action protocols", () => {
  const html = renderTransactionalEmail({
    preview: "Mensaje nuevo",
    title: "Nueva respuesta",
    body: "Tienes una respuesta nueva.",
    actionLabel: "Ver conversación",
    actionUrl: "javascript:alert(1)",
    language: "es",
    eyebrow: "NUEVO MENSAJE",
  });

  assert.match(html, /lang="es"/);
  assert.match(html, /NUEVO MENSAJE/);
  assert.match(html, /Privacidad/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /href="https:\/\/thewedmarket\.com\/?"/);
});
