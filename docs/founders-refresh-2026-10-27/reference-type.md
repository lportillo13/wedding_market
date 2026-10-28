# Reference typography refinement — October 27, 2026

The owner supplied three visual examples and requested matching font treatment and line height. This is a CSS-only website update using the already supplied GT Super, Lucia BT and Acumin Pro files. The logo remains the approved serif wordmark; the app release remains held.

- Hero: GT Super Light first line at line-height 1, followed by regular Lucia at .96em and .95 line-height with a small optical overlap. The centered caption stays centered. Supporting text is 16px/1.8 on desktop, with the existing shorter-screen adaptation.
- Magazine: GT Super Light at approximately 68px/1.1 on desktop, constrained to the reference's editorial wrapping. The accent uses larger Lucia at 1.35em/.9; the longer English phrase uses 1.15em to retain a single line on narrow screens. Supporting text is 16px/1.8 and the restrained link keeps its content width.
- Planning details: replace the inherited sans heading with GT Super Regular at up to 40px/1.05. List text is 14px/1.45 with 12px numbers, and the action uses 16px type with a 54px touch height. Existing tabs, destinations and content remain unchanged.

Local browser checks cover Spanish desktop and 390px phone magazine/planning views, plus English at 320px. Lucia renders in the requested accents, the compact phone has no horizontal overflow, and the English magazine accent fits one line after language-specific sizing. The 740px phone hero remains one viewport high; its text ends above the visible scroll arrow.

Production build and TypeScript passed. Live verification is recorded below after the exact receipt. No new font purchase, business workflow, legal text, database or native source change is included.
