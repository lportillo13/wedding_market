# Compact boutique introduction and mouse scroll cue

The owner requested a full-width boutique information section near the top, with a read-more control. `BoutiqueAbout` now precedes the collection and spans the same content width. A short two-line introduction remains visible; native accessible disclosure reveals the full story, languages, address/map, safety controls and visit policies. The existing fitting action opens the same required-policy request form. There is one section/anchor, with no duplicate content block below the collection.

The owner separately requested a small mouse-shaped scroll indicator in the full-height homepage hero. Its outlined mouse and moving wheel replace the circular arrow. The existing link, bilingual accessible name, 48px target, keyboard interaction, destination focus and header clearance remain. Reduced motion disables the wheel animation. The hero retains 100vh with a stable 100svh viewport enhancement.

Architecture, TypeScript, full lint and 109 web tests pass. The final phrasing-content disclosure markup additionally passes targeted lint and a fresh production build. Local browser checks verify matched 1132px introduction/collection widths, collapsed height of 155px, expansion/collapse, policies and fitting action, 320px phone layout, 390px/844px and 1280px/900px hero heights, 21×33px mouse, 48px hit area and keyboard focus on `benefits`. No schema, account, native source or native publication changed.

The owner requested three dress-detail design options before implementation. The thread-owned `outfit-detail-options.html` provides Atelier gallery, Runway focus and Magazine story using the current fonts and sample dress. All three render without overflow at a 320px browser width. These remain previews pending the owner's selection; the production dress-detail design is unchanged.

Live release evidence will be recorded after completion.
