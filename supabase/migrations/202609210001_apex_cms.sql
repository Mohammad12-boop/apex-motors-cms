-- Apex Motors CMS: apply to a new Supabase project before seed.sql.
-- Browser clients use only the project's publishable/anon key.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "Read own profile or administrator directory" on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
-- No INSERT, UPDATE, or DELETE grants/policies exist for browser users.
-- Admin role assignment is an operator action in the SQL editor, never user metadata.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (new.id, coalesce(new.email, ''), left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120), 'editor');
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles (id, email) select id, coalesce(email, '') from auth.users on conflict (id) do nothing;

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.set_updated_at() from public, anon, authenticated;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Each entity is a concrete table. Common bilingual fields are queryable columns;
-- flexible display fields (SEO, benefits, process, settings) are JSONB in data.
do $$
declare table_name text;
begin
  foreach table_name in array array['pages', 'hero_slides', 'services', 'features', 'blog_posts', 'blog_categories', 'albums', 'album_images', 'faqs', 'testimonials', 'team_members', 'navigation_items', 'social_links', 'site_settings', 'media', 'contact_messages', 'newsletter_subscribers'] loop
    execute format('create table public.%I (
      id uuid primary key default gen_random_uuid(),
      title_en text not null default '''', title_ar text not null default '''',
      description_en text not null default '''', description_ar text not null default '''',
      content_en text not null default '''', content_ar text not null default '''',
      slug text not null default '''',
      status text not null default ''draft'' check (status in (''draft'', ''published'', ''archived'', ''received'', ''active'', ''inactive'')),
      active boolean not null default true, sort_order integer not null default 0,
      image text not null default '''',
      data jsonb not null default ''{}''::jsonb check (jsonb_typeof(data) = ''object''),
      created_at timestamptz not null default now(), updated_at timestamptz not null default now()
    )', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create unique index %I on public.%I (slug) where slug <> ''''', table_name || '_slug_key', table_name);
    execute format('create index %I on public.%I (status, active, sort_order)', table_name || '_publication_order', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_updated_at', table_name);
    execute format('create policy "Administrators manage content" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    if table_name not in ('contact_messages', 'newsletter_subscribers', 'album_images') then
      execute format('create policy "Published public content" on public.%I for select to anon, authenticated using (status = ''published'' and active)', table_name);
      execute format('grant select on public.%I to anon', table_name);
    end if;
  end loop;
end;
$$;

alter table public.blog_posts add column category_id uuid references public.blog_categories(id) on delete set null;
create index blog_posts_category_id on public.blog_posts (category_id);
alter table public.album_images add column album_id uuid not null references public.albums(id) on delete cascade;
create index album_images_album_id on public.album_images (album_id, sort_order);
create policy "Published images in published albums" on public.album_images for select to anon, authenticated
using (status = 'published' and active and exists (
  select 1 from public.albums parent where parent.id = album_id and parent.status = 'published' and parent.active
));
grant select on public.album_images to anon;

alter table public.contact_messages
  add column name text not null check (char_length(btrim(name)) between 2 and 120),
  add column email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  add column phone text not null default '' check (char_length(phone) <= 40),
  add column subject text not null check (char_length(btrim(subject)) between 2 and 180),
  add column message text not null check (char_length(btrim(message)) between 10 and 5000),
  add column is_read boolean not null default false;
create index contact_messages_recent on public.contact_messages (created_at desc);
create index contact_messages_email_time on public.contact_messages (lower(email), created_at desc);

alter table public.newsletter_subscribers
  add column name text not null default '' check (char_length(name) <= 120),
  add column email text not null check (char_length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
create unique index newsletter_email_unique on public.newsletter_subscribers (lower(email));
create index newsletter_subscribers_recent on public.newsletter_subscribers (created_at desc);

-- Public submission is through tightly scoped functions only. Private rows cannot
-- be listed or read by anonymous clients, and no public table INSERT is granted.
create function public.submit_contact(p_name text, p_email text, p_phone text, p_subject text, p_message text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare clean_email text := lower(btrim(p_email)); result_id uuid;
begin
  if p_name is null or p_email is null or p_subject is null or p_message is null
    or char_length(btrim(p_name)) not between 2 and 120
    or char_length(clean_email) > 254
    or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(coalesce(p_phone, '')) > 40
    or char_length(btrim(p_subject)) not between 2 and 180
    or char_length(btrim(p_message)) not between 10 and 5000 then
    raise exception 'Please provide valid contact details and a message between 10 and 5000 characters.' using errcode = '22023';
  end if;
  -- Serializes submissions for one normalized email to make the limit race-safe.
  perform pg_advisory_xact_lock(hashtextextended('apex-contact:' || clean_email, 0));
  if (select count(*) from public.contact_messages where lower(email) = clean_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many messages from this email. Please try again later.' using errcode = 'P0001';
  end if;
  insert into public.contact_messages (name, email, phone, subject, message, title_en, title_ar, status, is_read)
  values (btrim(p_name), clean_email, btrim(coalesce(p_phone, '')), btrim(p_subject), btrim(p_message), btrim(p_subject), btrim(p_subject), 'received', false)
  returning id into result_id;
  return result_id;
end;
$$;
revoke all on function public.submit_contact(text, text, text, text, text) from public;
grant execute on function public.submit_contact(text, text, text, text, text) to anon, authenticated;

create function public.subscribe_newsletter(p_email text, p_name text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare clean_email text := lower(btrim(p_email)); result_id uuid;
begin
  if p_email is null or char_length(clean_email) > 254
    or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(coalesce(p_name, '')) > 120 then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  insert into public.newsletter_subscribers (name, email, title_en, title_ar, status, active)
  values (btrim(coalesce(p_name, '')), clean_email, coalesce(nullif(btrim(p_name), ''), clean_email), coalesce(nullif(btrim(p_name), ''), clean_email), 'active', true)
  on conflict (lower(email)) do nothing returning id into result_id;
  return case when result_id is null then 'duplicate' else 'success' end;
end;
$$;
revoke all on function public.subscribe_newsletter(text, text) from public;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;

-- This bucket contains public website imagery only. Never place private documents here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('apex-media', 'apex-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "Admin upload Apex media" on storage.objects for insert to authenticated
with check (bucket_id = 'apex-media' and (select public.is_admin()));
create policy "Admin view Apex objects" on storage.objects for select to authenticated
using (bucket_id = 'apex-media' and (select public.is_admin()));
create policy "Admin update Apex media" on storage.objects for update to authenticated
using (bucket_id = 'apex-media' and (select public.is_admin()))
with check (bucket_id = 'apex-media' and (select public.is_admin()));
create policy "Admin delete Apex media" on storage.objects for delete to authenticated
using (bucket_id = 'apex-media' and (select public.is_admin()));

commit;
