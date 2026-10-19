import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as config from "@/lib/supabase/config";
import * as server from "@/lib/supabase/server";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";

test("request-client creation leaves user verification to the route instead of calling Auth twice", async (t) => {
  const cookieClient = { auth: { getUser() { throw new Error("Must validate in the route"); } } } as unknown as SupabaseClient;
  t.mock.method(server, "createSupabaseServerClient", async () => cookieClient);
  const client = await createAuthenticatedRequestClient(new Request("https://example.invalid/api"));
  assert.equal(client, cookieClient);
});

test("native bearer authentication has priority over cookies and includes the public API key", async (t) => {
  t.mock.method(config, "getSupabaseUrl", () => "https://auth.example.invalid");
  t.mock.method(config, "getSupabasePublicKey", () => "synthetic-public-key");
  t.mock.method(server, "createSupabaseServerClient", async () => { throw new Error("Must not use another cookie identity"); });
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const request = new Request(input, init);
    assert.equal(new URL(request.url).pathname, "/auth/v1/user");
    assert.equal(request.headers.get("Authorization"), "Bearer synthetic-user-token");
    assert.equal(request.headers.get("apikey"), "synthetic-public-key");
    requests++;
    return Response.json({ id: "synthetic-user", app_metadata: {}, user_metadata: {} });
  });
  const client = await createAuthenticatedRequestClient(new Request("https://example.invalid/api", {
    headers: { Authorization: "bearer synthetic-user-token" },
  }));
  assert.equal(requests, 0);
  const { data, error } = await client.auth.getUser();
  assert.equal(error, null);
  assert.equal(data.user?.id, "synthetic-user");
  assert.equal(requests, 1);
});
