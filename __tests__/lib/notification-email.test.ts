import assert from "node:assert/strict";
import test from "node:test";
import { buildNotificationEmail, getNotificationEmailAction } from "../../lib/notification-email";

test("routes each notification to the independent client or vendor conversation", () => {
  const data = { rfqId: "rfq-1", vendorId: "vendor-1" };

  assert.match(getNotificationEmailAction("quote_answered", data, "en")?.url ?? "", /\/account\/inbox\/rfq-1__vendor-1$/);
  assert.match(getNotificationEmailAction("vendor_new_request", data, "en")?.url ?? "", /\/vendor\/inbox\/rfq-1__vendor-1$/);
  assert.match(getNotificationEmailAction("vendor_quote_accepted", data, "en")?.url ?? "", /\/vendor\/inbox\/rfq-1__vendor-1$/);
  assert.match(
    getNotificationEmailAction("thread_reply", { ...data, senderRole: "client" }, "en")?.url ?? "",
    /\/vendor\/inbox\/rfq-1__vendor-1$/
  );
  assert.match(
    getNotificationEmailAction("thread_reply", { ...data, senderRole: "vendor" }, "en")?.url ?? "",
    /\/account\/inbox\/rfq-1__vendor-1$/
  );
});

test("builds a localized, escaped notification email with a stable idempotency key", () => {
  const email = buildNotificationEmail(
    {
      notificationId: "notification-1",
      recipientId: "recipient-1",
      type: "thread_reply",
      title: "Nueva respuesta",
      body: "Un proveedor respondió.",
      data: {
        rfqId: "rfq-1",
        vendorId: "vendor-1",
        senderRole: "vendor",
        messagePreview: "<script>alert('x')</script>",
      },
      language: "es",
    },
    "couple@example.com"
  );

  assert.ok(email);
  assert.equal(email.to, "couple@example.com");
  assert.equal(email.idempotencyKey, "notification/notification-1");
  assert.match(email.text, /Ver conversación/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
});

test("does not build an email without a valid independent thread", () => {
  const email = buildNotificationEmail(
    {
      notificationId: "notification-1",
      recipientId: "recipient-1",
      type: "quote_answered",
      title: "New quote",
      body: "A vendor replied.",
      data: { rfqId: "rfq-1" },
      language: "en",
    },
    "couple@example.com"
  );

  assert.equal(email, null);
});
