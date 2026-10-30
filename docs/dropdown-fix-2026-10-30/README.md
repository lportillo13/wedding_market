# Account dropdown positioning repair

The owner reported a clipped account dropdown on the homepage. The live menu's
left edge was aligned to the compact avatar's left edge: its 270px panel ran from
x=1160.42 to x=1430.42 in a 1265px-wide document. Bootstrap's end-alignment class
does not supply the position for this React-controlled dropdown without Popper.

The account panel now explicitly anchors below the trigger with its right edges
aligned. Its width remains capped to the viewport, and short windows give the
panel a bounded height with internal scrolling so the final actions are reachable.
The correction is scoped to the account dropdown. Navigation destinations,
notifications, role checks, keyboard/outside-click behavior and profile A remain.

All 138 web tests, architecture, TypeScript, lint and production build pass.
[Local measurements](local-layout-checks.json) confirm contained menus for a
Spanish couple homepage and English vendor workspace, plus internal scrolling in
a 1280×360 window. Local layout previews use the actual header components with fictional
account data and force the panel open only in the temporary preview markup.

Application **facdeecbb1550dd86c82d99a5e911c84993b66e6** is verified live through
the fixed gateway's exact [successful receipt](deployment-success.json) and all
34 [public checks](public-checks.json), including the positioning/scroll stylesheet.
Rollback is `/var/www/wedding-market.before-20261030-151951`.

The owner's authenticated live homepage now places the panel from x=950 to
x=1220, aligned to the avatar's right edge and fully inside the 1265px document.
At 1280×360 its 234px scroll area stays within the window; keyboard focus can
reach and reveal the last action. Escape closes it and returns focus, and an
outside click closes it. [Sanitized measurements](live-verification.json).
No account/customer data or sign-out action was submitted. The viewport is reset
and local servers are stopped. The private screenshot remains in ignored cache.

The owner's follow-up request for three vendor-backend design options is a
separate [pending design choice](../vendor-workspace-options-2026-10-30/README.md).
