# Selected profile A — editorial sections

The owner selected Profile A after reporting inconsistent widths and a profile
style that did not match Wedding Market. The personal profile now shares one
outer grid with the existing header A and account navigation: warm ivory,
GT Super headings, thin dividers, a compact photo row and two numbered sections.
Contact details and wedding preferences use a two-column field grid on desktop
and stack on phones. One save footer completes the page.

The photo chooser has a labeled keyboard-accessible camera button. Selecting a
file reveals its name and a separate upload action; choosing a file never uploads
it automatically. Pending progress and success/error announcements remain, and a
failed upload retains its selected file for retry. The existing authenticated
upload endpoint, media limits and profile save action are unchanged.

All existing form fields and submitted names remain. Credential email stays
read-only and excluded from the update payload. Contact country is explicitly
labeled, wedding location remains Costa Rica, and guest count/budget remain
optional. English/Spanish copy and the existing language-setting behavior remain.
The style and shared-width override apply only to the personal profile; the
unified inboxes, role-aware header links and public pages retain their layouts.

All 138 web tests pass, including the bilingual retained-field, locked-email and
optional-estimate regression. Architecture, TypeScript, lint and final production
build pass. All 33 [local HTTP checks](local-http-checks.json) pass, including the
new profile stylesheet and narrow-phone gutter check.
Local component previews use fictional data and production CSS. No owner profile
save or photo upload is used for verification. Native release remains held.

Application **f62ff3cc650a8adcb59f66db4ce158f7e1b2c08d** is verified live through
the fixed release gateway's exact [successful receipt](deployment-success.json)
and all 33 [production checks](public-checks.json). Rollback is
`/var/www/wedding-market.before-20261030-150545`. The separate DW application and
database policies were not changed.

The authenticated owner's live profile confirms identical header, account-nav,
content, photo and form edges: 1169px at a 1280px desktop viewport and 281px at a
320px phone viewport. Phone client/scroll widths both measure 305px. Both sections
and their fields stack, controls retain a 46px minimum height and phone fields use
16px text. The native photo-chooser event opens from the custom button; no file
was selected or uploaded. Both languages were checked and Spanish was restored.
[Sanitized live measurements](live-verification.json),
[fictional local layout checks](local-layout-checks.json).

No profile save, message or account change was submitted for validation. Private
screenshots remain in ignored cache. Both temporary local servers are stopped,
the viewport override is reset, and the deployed profile tab remains available.
