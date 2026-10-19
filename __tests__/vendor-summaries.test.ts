import assert from "node:assert/strict";
import test from "node:test";
import { fetchVendorSummaries } from "@/lib/vendor-summaries";
import { getShortlist } from "@/lib/shortlist";

test("large shortlists load every vendor using bounded, deduplicated requests", async (t) => {
  const batches: string[][] = [];
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request) => {
    const url = new URL(String(input), "https://example.invalid");
    const ids = url.searchParams.get("ids")!.split(",");
    batches.push(ids);
    return Response.json({ items: ids.map((id) => ({ id, slug: id, business_name: id })) });
  });
  const ids = Array.from({ length: 121 }, (_, index) => `vendor-${index}`);
  const vendors = await fetchVendorSummaries([...ids, ids[0]]);
  assert.deepEqual(batches.map((batch) => batch.length), [50, 50, 21]);
  assert.deepEqual(vendors.map((vendor) => vendor.id), ids);
});

test("shortlist fetching stops on errors and preserves the caller's cancellation signal", async (t) => {
  const controller = new AbortController();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (_input: unknown, init?: RequestInit) => {
    assert.equal(init?.signal, controller.signal);
    calls++;
    return Response.json({ error: "Unavailable" }, { status: 503 });
  });
  await assert.rejects(fetchVendorSummaries(Array.from({ length: 120 }, (_, i) => String(i)), controller.signal), /503/);
  assert.equal(calls, 1);
});

test("malformed saved shortlist data cannot crash list operations", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let stored = '{}';
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => stored } });
  t.after(() => { if (original) Object.defineProperty(globalThis, "localStorage", original); else Reflect.deleteProperty(globalThis, "localStorage"); });
  assert.deepEqual(getShortlist(), []);
  stored = '["vendor-1",null,12,"vendor-1"," "," vendor-2 "]';
  assert.deepEqual(getShortlist(), ["vendor-1", "vendor-2"]);
});
