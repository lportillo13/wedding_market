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
});
