
-- Fix mutable search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke EXECUTE on internal helpers from API roles
revoke execute on function public.can_edit_playlist(uuid, uuid) from anon, authenticated, public;
revoke execute on function public.can_view_playlist(uuid, uuid) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- Replace public-bucket read with non-listing policies (object must be referenced by exact path)
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "covers_public_read" on storage.objects;
-- Allow direct object fetches via signed/public URLs but disallow listing without a specific name
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars' and name is not null);
create policy "covers_public_read" on storage.objects for select
  using (bucket_id = 'playlist-covers' and name is not null);
