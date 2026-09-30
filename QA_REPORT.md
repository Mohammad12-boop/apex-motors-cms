# Apex Motors — Final QA Report

Completed: 30 September 2026.

**Ready to proceed to the Git/delivery stage for review.** No Git, GitHub, deployment, or delivery actions were performed. No unresolved application defect was found within the tested scope.

## Final results

| Check | Result |
| --- | --- |
| TypeScript | Passed again after the logout fix (`npm run build` runs `tsc -b`) |
| Configured production build | Passed again after the logout fix; `dist/` contains the configured production build |
| Unit tests | 11 passed in final QA and again during delivery verification |
| Complete browser suite | 57 passed; the full suite passed again during delivery verification after the logout fix |
| Targeted logout regressions | Live delayed-sign-out regression and six protected-route/refresh checks passed; demo logout regression passed |
| Live public reads | All public content collections passed |
| Live public pages | EN/AR pages, service/article/album details, legal pages, navigation, images and language switching passed |
| Responsive | Previously passed EN/AR public widths 320, 375, 768, 1024, 1440, 1920; Admin table/editor widths 320, 375, 768, 1440 |
| Live authenticated CMS | Passed the CRUD and workflow checks below |
| Cleanup | All 21 temporary database records confirmed absent; no QA-uploaded Storage objects remain |

The complete browser suite uses an explicit demo build. Live Supabase checks were conducted separately using the administrator's manually authenticated Edge session. During final QA, affected live and demo authentication paths were retested after the narrowly scoped logout change. During the subsequent delivery preparation, TypeScript, all 11 unit tests, production safeguards and the complete 57-test browser suite were rerun successfully.

## Live CRUD and workflow coverage

Create, read/reload, edit, publish, public visibility, and delete passed for Pages, Hero slides, Services, Features, Blog categories, Blog posts, Gallery albums, Gallery images, FAQs, Testimonials, Team members, Navigation items, and Social links. Bilingual content persisted; temporary custom-page, service, article and album detail pages displayed in EN and AR. Draft records remained hidden from anonymous reads. The temporary feature also passed unpublish and delete-cancellation checks. Blog/category and album/image relationships passed.

Media upload to real Supabase Storage, image retrieval/rendering, bilingual metadata editing, media selection for a temporary service, and deletion passed. The public image URL briefly remained cached after deletion; an authenticated Storage listing confirmed that no objects created during either QA run remained.

Contact: real public submissions in EN and AR succeeded. Each temporary inquiry appeared in Admin, could be opened, marked read/unread, and retained its state after reload. Both messages were deleted.

Newsletter: invalid email validation, real subscription, Admin viewing/status editing, and a case-normalized duplicate submission through the Arabic form passed. Only one subscriber record existed for the temporary email, and it was deleted.

Admin alphabetical sorting, next/previous pagination, live settings reads, language switching, RTL/LTR direction and language persistence after reload passed. Real site settings and existing content were not changed.

## Authentication and access control

The manually authenticated administrator session survived reload and permitted the expected CMS operations. Logout was verified against the live Supabase endpoint, including an intentionally delayed response. Once logout completed, direct navigation and refresh were denied for `/admin`, Services, Messages, Subscribers, Administrators, and Website settings. The QA window was left signed out.

Earlier anonymous checks denied access to contact messages, newsletter subscribers and administrator profiles. Invalid login and unauthenticated protected-route behavior were also checked. This audit did not create a second, non-administrator account or execute the transactional SQL policy test script; it is not an exhaustive security assessment.

## Issues found and fixes

1. Narrow-screen shared grid rules overrode intended single-column card layouts. Increased specificity of the existing mobile selectors restored their intended behavior.
2. Intrinsic image/form widths caused About and newsletter overflow at 320px; the Journal newsletter strip could also overflow with fallback fonts. Added minimum-width constraints and a responsive image width. EN/AR and fallback-font regressions passed without redesign.
3. Live logout exposed the login UI before Supabase finished clearing the persisted session. Immediate navigation could restore access from that session. Moved local logout state clearing after successful Supabase sign-out. The delayed-response regression, immediate protected navigation, refresh restrictions and demo logout passed.

The live QA scripts also needed selector corrections for relationship fields and a correction for the Fetch API's boolean `ok` property. These were test-harness issues, not application defects. Their affected checks were rerun successfully. Raw first-attempt reports retain those failures for traceability; targeted results and direct cleanup proof resolve them.

## Cleanup and scope

Temporary prefixes: `QA-Apex-1790799415232` and `QA-Apex-1790799529674`.

All 21 created database IDs were checked using the authenticated administrator's normal permissions and returned zero rows. Searches across the tested CMS collections also found no records with either prefix. Supabase Storage contained no objects created during the QA runs. No real production record was deleted or edited. Temporary browser profiles and local QA evidence are separate from application content; no password or token was saved in QA reports.

Remaining scope limits: live website/footer/SEO settings were read only, with edits covered by the existing demo suite; no independent non-admin account/SQL security audit was performed. These do not block the requested Git/delivery review, but this report does not certify deployment or an exhaustive security audit.

## Files changed

- `src/pages/public-pages.css`: previously completed narrow-screen overflow fixes.
- `tests/responsive.spec.ts`: previously completed expanded responsive and fallback-font coverage.
- `src/context/AuthContext.tsx`: logout sequencing fix in this continuation.
- `QA_REPORT.md`: this final report.
- Temporary local QA scripts and evidence were reviewed and removed during delivery preparation; maintained automated tests are retained.

Supabase configuration, migrations, queries, environment variables, content, translations and visual identity were not modified.

## Evidence and delivery cleanup

The detailed generated browser reports, screenshots, temporary live-test scripts and machine-readable QA evidence were reviewed during final QA. Before delivery cleanup, the authenticated cleanup proof and both run ledgers were checked again: all 21 temporary IDs were absent and no QA Storage objects remained. No new live database mutations were performed during delivery preparation.

Generated evidence under .qa/, playwright-report/ and test-results/ was removed from the submission during delivery cleanup. This report preserves the results and limitations. The maintained automated tests remain in tests/ and src/lib/, and npm run verify regenerates local reports. Generated output and local environment configuration are ignored by Git.
