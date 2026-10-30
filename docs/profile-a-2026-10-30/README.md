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
optional-estimate regression. Architecture, TypeScript, lint and production build
pass. The exact deployment/live verification is recorded below after completion.
Local component previews use fictional data and production CSS. No owner profile
save or photo upload is used for verification. Native release remains held.
