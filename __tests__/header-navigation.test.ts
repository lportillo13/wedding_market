import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getHeaderAccountLinks,
  isHeaderLinkCurrent,
} from "../lib/header-navigation";

test("vendor navigation retains the unified vendor inbox and owned workspace destinations", () => {
  const links = getHeaderAccountLinks(true);
  assert.ok(links.some((link) => link.href === "/vendor/inbox"));
  assert.ok(links.some((link) => link.href === "/vendor/profile"));
  assert.ok(links.some((link) => link.href === "/account/profile" && link.label === 'auth.personalProfile'));
  assert.ok(links.every((link) => link.href.startsWith("/vendor") || link.href === '/account/profile'));
  assert.ok(!links.some(link => link.href === '/account/inbox' || link.href === '/account/reviews'));
});
test("client navigation retains the independent client inbox and profile", () => {
  const links = getHeaderAccountLinks(false);
  assert.ok(links.some((link) => link.href === "/account/inbox"));
  assert.ok(links.some((link) => link.href === "/account/profile"));
  assert.ok(links.every((link) => link.href.startsWith("/account/")));
});
test("active navigation matches a route boundary and does not mark the workspace overview on every vendor page", () => {
  assert.equal(
    isHeaderLinkCurrent("/account/inbox/request-1", "/account/inbox"),
    true,
  );
  assert.equal(isHeaderLinkCurrent("/blog/wedding-venues", "/blog"), true);
  assert.equal(isHeaderLinkCurrent("/blogger", "/blog"), false);
  assert.equal(isHeaderLinkCurrent("/vendor/profile", "/vendor"), false);
});
