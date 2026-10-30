import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { AuthSessionMissingError, type User } from "@supabase/supabase-js";
import { loadHeaderAccount, type HeaderAccount } from "../lib/header-account";
import { LanguageProvider } from "../contexts/LanguageContext";

const user = {
  id: "header-test-user",
  email: "header-test@example.invalid",
  user_metadata: { full_name: "Test Couple", unrelated: "not-for-the-header" },
  app_metadata: { sensitive: "not-for-the-header" },
  aud: "authenticated",
  created_at: "2026-10-19T00:00:00Z",
} satisfies User;
const signedIn = async () => ({ data: { user }, error: null });

test("a normal signed-out visitor gets guest actions without a role request", async () => {
  let roleCalls = 0;
  for (const error of [null, new AuthSessionMissingError()]) {
    const result = await loadHeaderAccount({
      getUser: async () => ({ data: { user: null }, error }),
      isVendor: async () => {
        roleCalls++;
        throw new Error("must not run");
      },
    });
    assert.deepEqual(result, { status: "guest" });
  }
  assert.equal(roleCalls, 0);
});

test("verified client and vendor snapshots preserve the correct workspace and only header fields", async () => {
  for (const isVendor of [false, true]) {
    const account = await loadHeaderAccount({
      getUser: signedIn,
      isVendor: async (id) => {
        assert.equal(id, user.id);
        return { data: isVendor, error: null };
      },
    });
    assert.equal(account.status, "authenticated");
    if (account.status !== "authenticated") throw new Error("Missing account");
    assert.equal(account.isVendor, isVendor);
    assert.equal(
      account.user.user_metadata.full_name,
      user.user_metadata.full_name,
    );
    assert.deepEqual(Object.keys(account.user).sort(), [
      "email",
      "id",
      "user_metadata",
    ]);
    assert.doesNotMatch(
      JSON.stringify(account),
      /not-for-the-header|app_metadata/,
    );
  }
});

test("auth and role failures are recoverable and never silently turn a vendor into a client", async () => {
  for (const result of [
    { data: null, error: new Error("offline") },
    { data: null, error: null },
  ]) {
    assert.deepEqual(
      await loadHeaderAccount({
        getUser: signedIn,
        isVendor: async () => result,
      }),
      { status: "unavailable" },
    );
  }
  assert.deepEqual(
    await loadHeaderAccount({
      getUser: async () => ({
        data: { user: null },
        error: new Error("offline"),
      }),
      isVendor: async () => {
        throw new Error("must not run");
      },
    }),
    { status: "unavailable" },
  );
  assert.deepEqual(
    await loadHeaderAccount({
      getUser: async () => {
        throw new Error("offline");
      },
      isVendor: async () => ({ data: false, error: null }),
    }),
    { status: "unavailable" },
  );
});

test("a hanging auth request has a deadline and cannot start a late role request", async () => {
  let finish!: (value: Awaited<ReturnType<typeof signedIn>>) => void;
  let roleCalls = 0;
  const result = await loadHeaderAccount(
    {
      getUser: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
      isVendor: async () => {
        roleCalls++;
        return { data: true, error: null };
      },
    },
    15,
  );
  assert.deepEqual(result, { status: "unavailable" });
  finish(await signedIn());
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(roleCalls, 0);
});

test("a hanging vendor lookup is aborted at the deadline", async () => {
  let signal: AbortSignal | undefined;
  const account = await loadHeaderAccount(
    {
      getUser: signedIn,
      isVendor: (_id, requestSignal) => {
        signal = requestSignal;
        return new Promise(() => {});
      },
    },
    15,
  );
  assert.deepEqual(account, { status: "unavailable" });
  assert.equal(signal?.aborted, true);
});

async function render(account: HeaderAccount, language: "en" | "es") {
  // The navbar and its descendants use Next navigation; no browser/session
  // requests or effects run during this server render.
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:1";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";
  const { default: NavBarContainer } = await import(
    "../components/NavBarContainer"
  );
  const router = {
    refresh() {},
    push() {},
    replace() {},
    back() {},
    forward() {},
    prefetch() {},
  };
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <PathnameContext.Provider value="/vendors">
        <LanguageProvider initialLanguage={language}>
          <NavBarContainer account={account} vendorCategories={[]} />
        </LanguageProvider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

test("guest menus already contain sign-in and signup actions in the server HTML in both languages", async () => {
  for (const language of ["en", "es"] as const) {
    const html = await render({ status: "guest" }, language);
    assert.match(html, /href="\/login"/);
    assert.match(html, /href="\/signup"/);
    assert.doesNotMatch(
      html,
      /Cargando tu cuenta|Loading your account|role="status"/,
    );
    assert.match(
      html,
      language === "es" ? /Tu boda empieza aquí/ : /Your wedding starts here/,
    );
  }
});

test("signed-in menus already contain the matching account links without browser auth", async () => {
  for (const language of ["en", "es"] as const) {
    for (const isVendor of [false, true]) {
      const html = await render(
        { status: "authenticated", user, isVendor },
        language,
      );
      assert.match(
        html,
        new RegExp(`href="/${isVendor ? "vendor" : "account"}/inbox"`),
      );
      assert.match(html, /Test Couple/);
      assert.doesNotMatch(
        html,
        /Cargando tu cuenta|Loading your account|href="\/login"/,
      );
    }
  }
});

test('Option A leaves only the inbox and compact account control in signed-in desktop actions', async () => {
  for (const language of ['en', 'es'] as const) {
    for (const isVendor of [false, true]) {
      const html = await render({status: 'authenticated', user, isVendor}, language);
      const actions = html.split('class="wm-site-header__desktop-actions"')[1].split('class="wm-site-header__mobile-actions"')[0];
      const beforeAccount = actions.split('class="wm-site-header__auth"')[0];
      assert.match(beforeAccount, new RegExp(`href="/${isVendor ? 'vendor' : 'account'}/inbox"`));
      assert.doesNotMatch(beforeAccount, /href="\/(rfq\/new|shortlist|account\/notifications|vendor\/notifications)"|wm-notification-dropdown/);
      assert.match(actions, /wm-account-menu__trigger/);
      assert.match(actions, /wm-account-menu__identity/);
      assert.match(actions, new RegExp(`href="/${isVendor ? 'vendor' : 'account'}/profile"`));
      assert.match(actions, new RegExp(`href="/${isVendor ? 'vendor' : 'account'}/notifications"`));
      if (isVendor) {
        assert.match(actions, /href="\/account\/profile"/);
        assert.doesNotMatch(actions, /href="\/(shortlist|rfq\/new)"/);
      } else {
        assert.match(actions, /href="\/shortlist"/);
        assert.match(actions, /href="\/rfq\/new"/);
      }
      const mobile = html.split('class="wm-site-header__mobile-actions"')[1].split('</dialog>')[0];
      assert.match(mobile, new RegExp(`href="/${isVendor ? 'vendor' : 'account'}/inbox"`));
    }
  }
});

test("unavailable accounts render a translated retry action instead of a loading or false sign-in state", async () => {
  for (const language of ["en", "es"] as const) {
    const html = await render({ status: "unavailable" }, language);
    assert.match(html, /role="status"/);
    assert.match(html, language === "es" ? /Reintentar/ : /Retry/);
    assert.doesNotMatch(
      html,
      /Cargando tu cuenta|Loading your account|href="\/login"|href="\/account\/inbox"|href="\/vendor\/inbox"/,
    );
  }
});

test('non-vendor accounts require explicit couple access before showing couple-only menu actions', async () => {
  for (const language of ['en','es'] as const) {
    const html = await render({status:'authenticated',user,isVendor:false,isUser:false},language);
    assert.match(html,/href="\/account\/profile"/);
    assert.match(html,/href="\/account\/notifications"/);
    assert.match(html,/href="\/shortlist"/);
    assert.doesNotMatch(html,/href="\/account\/inbox"|href="\/rfq\/new"/);
  }
});

test('both header capabilities are verified, and a failed couple lookup never becomes a couple menu', async () => {
  const account = await loadHeaderAccount({getUser:signedIn,isVendor:async()=>({data:false,error:null}),isUser:async()=>({data:false,error:null})});
  assert.equal(account.status,'authenticated');
  if(account.status==='authenticated') {assert.equal(account.isUser,false);assert.equal(account.isVendor,false);}
  const failed = await loadHeaderAccount({getUser:signedIn,isVendor:async()=>({data:false,error:null}),isUser:async()=>({data:null,error:new Error('Offline')})});
  assert.deepEqual(failed,{status:'unavailable'});
});
