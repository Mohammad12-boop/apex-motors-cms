# Connect the Apex Motors CMS

1. Create a Supabase project. Run `migrations/202609210001_apex_cms.sql` in the SQL editor, followed by `seed.sql`. The migration targets a new project and is applied once; seed inserts can be safely repeated.
2. Create the initial administrator in Authentication → Users (the site intentionally has no public signup form). Then assign the role using the SQL editor:

   ```sql
   update public.profiles set role = 'admin'
   where id = 'REPLACE_WITH_AUTH_USER_UUID';
   ```

   Use the exact UUID from Authentication. Newly created users receive `editor`, which has no CMS privileges. Role changes are not exposed to browser clients, including administrators.
3. Copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project's public URL and anon/publishable key, and restart Vite. Never put a service-role key in a `VITE_` variable.
4. Configure the Authentication site URL and allowed redirect URLs for the deployed origin. Create strong administrator credentials through the Supabase console. Public self-signup can be disabled there.
5. Sign in at `/admin/login`. Check an edit, file upload, contact submission, and newsletter signup using the connected project. Verify that an anonymous query cannot read either private submission table, and that an ordinary authenticated user cannot write content.

Run `security-checks.sql` in the project's SQL editor to exercise anonymous and non-admin reads/writes, profile self-promotion rejection, input validation, and normalized subscription duplicates. The script runs in a transaction and rolls all test submissions back. It requires the migration and seed first. This repository does not imply that checks have been executed against a remote project; they require your configured Supabase environment.

## Content and security

All 17 content collections are separate tables. Their common bilingual fields and publication controls are physical columns. Category and album relationships use foreign keys; album removal cascades to its images and category removal clears the post reference. Variable presentation fields such as service benefits, ordered process steps, SEO fields, and contact settings use a `data` JSONB object and are flattened by the client adapter.

RLS allows public reads of active, published records only. An album image also requires a published, active parent album. Administrator access uses a protected profile role rather than editable user metadata. Contact and newsletter tables have no anonymous access. Scoped security-definer RPC functions validate input and insert only permitted fields. Contact submissions are limited to three per normalized email per hour under a transaction lock. Newsletter emails are normalized and have a database unique index, including concurrent submissions. Add edge-level IP controls or a challenge provider if the deployment needs stronger spam protection; an email rate limit is not a complete anti-bot system.

The `apex-media` storage bucket allows administrators to upload JPEG, PNG, WebP, AVIF, or GIF files up to 5 MB. It is a **public image bucket**: knowing a file URL permits access even if its referencing content becomes a draft. Store only assets intended for public display. The CMS removes the associated storage object when its media record is deleted; content references should be updated before removal.

## Demo behavior

Without Supabase, the public site loads `src/data/seed.json`. In development, the explicitly selected demo administrator workspace and form submissions use this browser's local storage. A deployed static demo must deliberately set `VITE_ENABLE_DEMO=true`; otherwise it displays sample content but cannot save submissions or changes. This is a presentation mode, not authentication or a multi-user backend. The login page does not accept fake passwords or silently switch a failed Supabase connection to demo mode. Demo administrator sessions use session storage, edits use local storage, and demo uploads are limited to 1 MB. Clear the `apex-cms-v1` local storage key to restore the bundled dataset.

Demo business details, metrics, testimonials, people, and timeline are illustrative. Verify or replace them in the CMS before commercial publication. Inactive social records are deliberate: supply real business account URLs before enabling them. Review the editable privacy and terms templates for the actual business and jurisdiction. Newsletter signup stores consent interest/subscriber records; it does not send email campaigns. Contact submission stores a message; it does not dispatch an email notification. No paid API is required.

## Seed maintenance

The curated `src/data/seed.json` snapshot contains 105 records, including 3 slides, 6 services, 8 features, 6 full bilingual articles, 4 albums, 24 gallery images, 8 FAQs, 4 testimonials, 3 team members, editable pages/policies/settings/navigation, and a media collection. Run `node supabase/generate-seed.mjs` to regenerate matching SQL from that snapshot. Existing remote records are preserved by `ON CONFLICT (id) DO NOTHING`; deliberately reconcile content updates in the CMS. `create-demo-content.mjs` resets the dataset to its source template and can replace curated local image paths with external references; it is not an installation or build step.

The 15 bundled photographs are stored locally in `public/images/` and served with the application. Original Unsplash URLs and file details are recorded in `public/images/sources.json`. The JSON dataset and generated SQL use these local image paths, so deploy the corresponding static assets alongside the frontend. New images can be uploaded through the CMS to the Supabase media bucket. Review the selected image licenses and any visible brand usage for the final commercial content.

## References

- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Managing user data](https://supabase.com/docs/guides/auth/managing-user-data)
- [Auth state change callbacks](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)
