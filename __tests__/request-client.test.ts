import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as config from "@/lib/supabase/config";
import * as server from "@/lib/supabase/server";
import { createAuthenticatedRequestClient, updateAuthenticatedUserMetadata } from "@/lib/supabase/request";

test("request-client creation leaves user verification to the route instead of calling Auth twice", async (t) => {
  const cookieClient = { auth: { getUser() { throw new Error("Must validate in the route"); } } } as unknown as SupabaseClient;
  t.mock.method(server, "createSupabaseServerClient", async () => cookieClient);
  const client = await createAuthenticatedRequestClient(new Request("https://example.invalid/api"));
  assert.equal(client, cookieClient);
});

test('native metadata writes use only the supplied user token without requiring a refresh session', async t => {
  t.mock.method(config,'getSupabaseUrl',()=> 'https://auth.example.invalid');
  t.mock.method(config,'getSupabasePublicKey',()=> 'synthetic-public-key');
  const client={auth:{updateUser(){throw Error('Native client has no persisted refresh session');}}} as unknown as SupabaseClient;
  t.mock.method(globalThis,'fetch',async(input:string|URL|Request,init?:RequestInit)=>{
    const req=new Request(input,init);
    assert.equal(req.url,'https://auth.example.invalid/auth/v1/user');
    assert.equal(req.method,'PUT');
    assert.equal(req.headers.get('Authorization'),'Bearer synthetic-native-token');
    assert.equal(req.headers.get('apikey'),'synthetic-public-key');
    assert.deepEqual(await req.json(),{data:{avatar_image:{url:'https://media.example.invalid/owned-test.webp'}}});
    assert.equal(init?.redirect,'error');
    return Response.json({id:'synthetic-user'});
  });
  const result=await updateAuthenticatedUserMetadata(new Request('https://example.invalid/api',{headers:{Authorization:'Bearer synthetic-native-token'}}),client,{avatar_image:{url:'https://media.example.invalid/owned-test.webp'}});
  assert.equal(result.error,null);
});

test('cookie metadata writes retain the current web session and provider failures remain recoverable', async t => {
  const client={auth:{updateUser:async(input:unknown)=>{assert.deepEqual(input,{data:{avatar_image:null}});return {error:null};}}} as unknown as SupabaseClient;
  assert.equal((await updateAuthenticatedUserMetadata(new Request('https://example.invalid/api'),client,{avatar_image:null})).error,null);
  t.mock.method(config,'getSupabaseUrl',()=> 'https://auth.example.invalid');
  t.mock.method(config,'getSupabasePublicKey',()=> 'synthetic-public-key');
  t.mock.method(globalThis,'fetch',async()=>Response.json({error:'private provider detail'},{status:401}));
  const result=await updateAuthenticatedUserMetadata(new Request('https://example.invalid/api',{headers:{Authorization:'Bearer expired-synthetic-token'}}),client,{avatar_image:null});
  assert.match(result.error?.message??'',/try again/);
  assert.doesNotMatch(result.error?.message??'',/private provider detail/);
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
