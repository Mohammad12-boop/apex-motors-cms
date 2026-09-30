-- Run in the Supabase SQL editor AFTER the migration and seed.
-- This exercises actual permissions and rolls back every test submission.
-- It intentionally fails with an exception if a security boundary is missing.
begin;

do $$
declare table_name text;
begin
  foreach table_name in array array['profiles','pages','hero_slides','services','features','blog_posts','blog_categories','albums','album_images','faqs','testimonials','team_members','navigation_items','social_links','site_settings','media','contact_messages','newsletter_subscribers'] loop
    if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = table_name and c.relrowsecurity) then
      raise exception 'RLS is missing on %', table_name;
    end if;
  end loop;
end;
$$;

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
do $$
begin
  if public.is_admin() then raise exception 'Anonymous user was granted administrator access'; end if;
  begin
    perform count(*) from public.contact_messages;
    raise exception 'Anonymous user could read contact messages';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.newsletter_subscribers;
    raise exception 'Anonymous user could read subscribers';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.services (title_en) values ('Unauthorized insert');
    raise exception 'Anonymous user could insert content';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.services where status <> 'published' or not active) then
    raise exception 'Anonymous user could read unpublished content';
  end if;
  if exists (select 1 from public.album_images image left join public.albums parent on parent.id = image.album_id where parent.id is null or parent.status <> 'published' or not parent.active) then
    raise exception 'Anonymous user could read images in an unpublished album';
  end if;

  begin
    perform public.submit_contact('', 'invalid', '', '', 'short');
    raise exception 'Invalid contact submission was accepted';
  exception when invalid_parameter_value then null;
  end;
  perform public.submit_contact('Security check', 'apex-security-check@example.invalid', '', 'Security test', 'This temporary contact will be rolled back.');
  if public.subscribe_newsletter(' APEX-SECURITY-CHECK@EXAMPLE.INVALID ', 'Security check') <> 'success' then
    raise exception 'Valid normalized newsletter signup failed';
  end if;
  if public.subscribe_newsletter('apex-security-check@example.invalid', 'Duplicate') <> 'duplicate' then
    raise exception 'Case-insensitive duplicate newsletter was accepted';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000099"}';
do $$
begin
  if public.is_admin() then raise exception 'Unprovisioned authenticated user gained administrator access'; end if;
  begin
    insert into public.pages (title_en) values ('Unauthorized authenticated insert');
    raise exception 'Non-admin authenticated user could insert content';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'Browser role can execute profile promotion';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from public.contact_messages) then raise exception 'Non-admin authenticated user could read the inbox'; end if;
  if exists (select 1 from public.newsletter_subscribers) then raise exception 'Non-admin authenticated user could read subscribers'; end if;
end;
$$;

rollback;
-- Success: no exceptions and no test records persisted.
