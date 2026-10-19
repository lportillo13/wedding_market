import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as email from "@/lib/notification-email";
import * as push from "@/lib/push-notifications";
import { createQuoteAnsweredNotification } from "@/lib/notifications";

function clientFixture(failInsert = false) {
  return {
    rpc: () => ({ abortSignal: async () => ({ data: "es", error: null }) }),
    from: () => ({ insert: () => ({ abortSignal: async () => {
      if (failInsert) throw new Error("synthetic disconnected database");
      return { error: null };
    } }) }),
  } as unknown as SupabaseClient;
}
const input = { recipientId: "recipient", actorId: "actor", rfqId: "rfq", quoteId: "quote", vendorId: "vendor",
  vendorName: "Synthetic vendor", amountCents: 1000, isUpdate: false };

test("provider rejection preserves the saved notification and still attempts the other channel", async (t) => {
  t.mock.method(console, "warn", () => {});
  let emailAttempts = 0;
  t.mock.method(push, "sendMobilePushNotification", async () => { throw new Error("synthetic push failure"); });
  t.mock.method(email, "deliverNotificationEmail", async () => { emailAttempts++; });
  const result = await createQuoteAnsweredNotification(clientFixture(), input);
  assert.ok(result.data?.id);
  assert.equal(result.error, null);
  assert.equal(emailAttempts, 1);
});

test("database transport failure becomes a notification error and sends neither external channel", async (t) => {
  t.mock.method(console, "warn", () => {});
  const pushCall = t.mock.method(push, "sendMobilePushNotification", async () => {});
  const emailCall = t.mock.method(email, "deliverNotificationEmail", async () => {});
  const result = await createQuoteAnsweredNotification(clientFixture(true), input);
  assert.equal(result.data, null);
  assert.ok(result.error);
  assert.equal(pushCall.mock.callCount(), 0);
  assert.equal(emailCall.mock.callCount(), 0);
});
