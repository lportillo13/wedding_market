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
a 1280×360 window. The exact deployment/live measurements are recorded below after
completion. Local layout previews use the actual header components with fictional
account data and force the panel open only in the temporary preview markup.
