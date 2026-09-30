# Apex Motors

A bilingual automotive website and content management system built with React, TypeScript, Vite, Tailwind CSS, and Supabase. English uses LTR layout; Arabic uses RTL throughout the public website and administration workspace.

## Run locally

Use Node.js 22.18 or newer and npm. The Vite commands use Node's native TypeScript configuration loader.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`. No backend credentials are required to explore the bundled content. On Windows, use `npm.cmd` if PowerShell blocks the `npm.ps1` launcher.

Visit `/admin/login` and select **Open demo workspace** to make local demonstration edits. Demo content, contact submissions, and newsletter subscriptions are stored in this browser. The administrator session lasts for the browser tab session; it is not a real authentication account. Clear local storage key `apex-cms-v1` to restore the bundled dataset, then reload.

## Build and preview

```sh
npm run build:demo
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173`. `build:demo` explicitly enables the browser demo for a static preview. It still uses Supabase when both Supabase environment variables are configured.

For a normal deployment, use `npm run build` and publish `dist/`. This build does not enable local demonstration writes unless `VITE_ENABLE_DEMO=true` was deliberately set. Without a connected backend or that flag, the published sample website is read-only and forms report that saving is unavailable. Environment variables are applied at build time, so rebuild after changing them.

SPA fallback configuration is included for Vercel (`vercel.json`) and Netlify (`public/_redirects`). Other hosts must serve `index.html` for application routes such as `/services/vehicle-sales` and `/admin/login` while preserving static file requests.

## Connect Supabase

1. Create a Supabase project and run `supabase/migrations/202609210001_apex_cms.sql` in its SQL editor, then `supabase/seed.sql`.
2. Create an administrator in Supabase Authentication. Promote the corresponding profile using its exact Auth UUID:

   ```sql
   update public.profiles set role = 'admin'
   where id = 'REPLACE_WITH_AUTH_USER_UUID';
   ```

3. Copy `.env.example` to `.env.local` and fill in:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   VITE_ENABLE_DEMO=false
   ```

4. Set the Authentication site URL and redirect URLs for your deployment, restart development or rebuild, and sign in at `/admin/login` with the created account.
5. Run `supabase/security-checks.sql` in the SQL editor. It tests anonymous and non-admin permissions, role escalation prevention, validated submissions, and duplicate subscriptions, then rolls back its test data.

Never use a service-role key in frontend environment variables. New Auth users receive an unprivileged profile; browser clients cannot promote themselves. Connected backend failures are displayed and do not switch silently to the local demo. Full setup and storage details are in [supabase/README.md](supabase/README.md).

## Website and CMS

Public routes cover Home, About, Services, individual services, Features, Blog, individual articles, Gallery, individual albums, Contact, FAQ, Newsletter, Privacy, and Terms. Service, article, and album routes use their editable slugs. Navigation and the language switcher connect these pages; metadata includes titles, descriptions, canonical URLs, and Open Graph fields.

Additional pages created in the CMS are published at `/pages/:slug`. Standard pages and custom pages both respect the Published and Active controls. Add a navigation entry to make a custom page discoverable from the header or footer.

The admin workspace provides content CRUD, search, ordering, publication controls, bilingual editing, media upload/selection, contact message management, subscribers, navigation, footer settings, website settings, and SEO settings. Set both **Published** and **Active** for public content. Gallery images also require a published, active parent album.

The bundled dataset contains 105 records, including 3 hero slides, the 6 requested automotive services, 8 features, 6 full bilingual articles, 4 albums with 24 images, 8 FAQs, 4 testimonials, team profiles, editable page content, navigation, and settings. The 15 source photographs are stored locally in `public/images/`; their original URLs are recorded in `public/images/sources.json`.

## Architecture

| Location | Responsibility |
| --- | --- |
| `src/App.tsx` | Public routing, lazy admin loading, and error boundary |
| `src/context/LanguageContext.tsx` | Language preference and document direction |
| `src/context/AuthContext.tsx` | Supabase sessions, administrator role checks, explicit demo access |
| `src/context/CmsContext.tsx` | Data loading, CRUD, submissions, persistence, and media upload |
| `src/lib/cms-data.ts` | Database adapters, public visibility, and record validation |
| `src/lib/types.ts` | Shared content model, localization helpers, and URL/input validation |
| `src/components/` | Shared layout, forms, cards, page sections, and SEO |
| `src/pages/` | Home and all public page implementations |
| `src/admin/` | Dashboard, reusable editors/tables, and module definitions |
| `src/data/seed.json` | Curated bilingual demo content, including local image paths |
| `supabase/` | Migration, matching SQL seed, setup notes, and security checks |
| `tests/` | Playwright public, admin, and responsive scenarios |

The database has a protected `profiles` table plus 17 content collections: `pages`, `hero_slides`, `services`, `features`, `blog_posts`, `blog_categories`, `albums`, `album_images`, `faqs`, `testimonials`, `team_members`, `navigation_items`, `social_links`, `site_settings`, `media`, `contact_messages`, and `newsletter_subscribers`.

Common bilingual text and publication fields are database columns. Album/category relationships use foreign keys. Flexible fields such as benefits, process steps, SEO, and settings live in JSONB and round-trip through the shared adapter. RLS restricts public reads to permitted content and reserves mutations and private records for administrators. Public forms use narrowly scoped database functions.

## Verification

```sh
npm run typecheck
npm test
npm audit
npm run build:demo
npm run test:e2e
```

`npm run verify` runs TypeScript, unit tests, a normal production build, browser checks confirming that unconfigured production does not expose demo administration or silently save submissions, a demo build, and the full browser suite. It leaves `dist/` as the explicit demo build and writes results under `.qa/`. Run `npm run build` again for a configured live deployment. Generated QA files, browser reports, caches, and local environment files are excluded from version control. The maintained verification entry points are in `scripts/`; temporary audit scripts are not required.

The unit suite contains 11 tests covering content completeness, Arabic content, references, publication/private-data filtering, duplicates, adapter integrity, and safe image URLs. The final QA passed all 57 browser integration tests, covering public routes, language direction, forms, admin CRUD/persistence, settings, publication controls and responsive layouts down to 320px. Run them against the isolated demo build rather than a production database; `npm run verify` clears backend configuration for its test builds without changing environment files. Authenticated live CMS, contact, newsletter, media, cleanup and logout checks were completed separately. See [QA_REPORT.md](QA_REPORT.md) for results and verification boundaries.

Playwright currently targets installed Microsoft Edge and starts the preview server on port 4173. On Windows, a bundled Chromium alternative is:

```powershell
npx playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:e2e
```

The preview command selects the appropriate npm launcher for Windows, macOS, or Linux. Failure screenshots/traces are retained, and the HTML report is written to `playwright-report/`. Live Supabase integration and SQL permission checks require an actual configured project; local tests do not establish remote deployment status.

In restricted Windows sandboxes, Vite's development dependency optimizer can be denied permission to inspect ancestor directories. The production build and `build:demo` + `preview` workflow remain available and are the basis of the browser verification here.

## Deployment details

- Replace illustrative company details, metrics, team profiles, testimonials, and timeline with verified business content. Add real social account URLs before activating those links.
- Set the canonical website URL, default metadata, logo/favicon, contact details, and working hours in the CMS. Review the editable legal pages for the actual business practices.
- Contact forms store messages; they do not send email notifications. Newsletter signup stores subscribers and prevents duplicates; campaign delivery and automated unsubscribe email links are not included.
- The map is an editable-location placeholder, not a live maps integration. Service inquiries are contact requests rather than confirmed calendar bookings or online payments.
- Supabase uploads allow JPEG, PNG, WebP, AVIF, or GIF images up to 5 MB. The `apex-media` bucket is public; use it for public website assets only. Local demo uploads are limited to 1 MB and browser storage capacity.
- Contact RPC submissions are limited to three per normalized email per hour. Add deployment-level spam controls if needed for public traffic. No paid API is required.

To update the SQL seed from the current curated JSON, run `node supabase/generate-seed.mjs`. Existing database records are preserved by ID; make routine published-content changes in the CMS. `create-demo-content.mjs` is a source-template reset tool and can overwrite curated content and local image references, so it is not part of installation or normal builds.
