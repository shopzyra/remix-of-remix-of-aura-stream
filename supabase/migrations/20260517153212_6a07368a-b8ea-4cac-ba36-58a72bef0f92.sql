
-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- UPDATED_AT helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- UPLOADED TRACKS
create table public.uploaded_tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text,
  album text,
  duration_seconds int,
  storage_path text not null,
  cover_url text,
  created_at timestamptz not null default now()
);
alter table public.uploaded_tracks enable row level security;
create policy "uploaded_select_own" on public.uploaded_tracks for select using (auth.uid() = owner_id);
create policy "uploaded_insert_own" on public.uploaded_tracks for insert with check (auth.uid() = owner_id);
create policy "uploaded_update_own" on public.uploaded_tracks for update using (auth.uid() = owner_id);
create policy "uploaded_delete_own" on public.uploaded_tracks for delete using (auth.uid() = owner_id);
create index uploaded_tracks_owner_idx on public.uploaded_tracks(owner_id, created_at desc);

-- PLAYLISTS
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_url text,
  is_public boolean not null default false,
  is_collaborative boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.playlists enable row level security;
create trigger playlists_updated_at before update on public.playlists
  for each row execute function public.set_updated_at();

-- COLLABORATORS
create table public.playlist_collaborators (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (playlist_id, user_id)
);
alter table public.playlist_collaborators enable row level security;

-- Helper: can user edit playlist?
create or replace function public.can_edit_playlist(_playlist_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.playlists p
    where p.id = _playlist_id
      and (p.owner_id = _user_id
        or (p.is_collaborative and exists (
          select 1 from public.playlist_collaborators c
          where c.playlist_id = _playlist_id and c.user_id = _user_id
        )))
  );
$$;

create or replace function public.can_view_playlist(_playlist_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.playlists p
    where p.id = _playlist_id
      and (p.is_public or p.owner_id = _user_id
        or exists (select 1 from public.playlist_collaborators c
          where c.playlist_id = _playlist_id and c.user_id = _user_id))
  );
$$;

create policy "playlists_select" on public.playlists for select
  using (is_public or owner_id = auth.uid()
    or exists (select 1 from public.playlist_collaborators c
      where c.playlist_id = id and c.user_id = auth.uid()));
create policy "playlists_insert_own" on public.playlists for insert with check (auth.uid() = owner_id);
create policy "playlists_update" on public.playlists for update
  using (owner_id = auth.uid() or (is_collaborative and exists (
    select 1 from public.playlist_collaborators c where c.playlist_id = id and c.user_id = auth.uid()
  )));
create policy "playlists_delete_own" on public.playlists for delete using (auth.uid() = owner_id);

create policy "collab_select" on public.playlist_collaborators for select
  using (public.can_view_playlist(playlist_id, auth.uid()));
create policy "collab_insert_owner" on public.playlist_collaborators for insert
  with check (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));
create policy "collab_delete_owner" on public.playlist_collaborators for delete
  using (exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));

-- PLAYLIST TRACKS (supports external + uploaded sources)
create table public.playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  position int not null,
  source text not null check (source in ('audius','uploaded')),
  external_id text,
  uploaded_track_id uuid references public.uploaded_tracks(id) on delete cascade,
  title text not null,
  artist text,
  cover_url text,
  duration_seconds int,
  stream_url text,
  added_by uuid references auth.users(id),
  added_at timestamptz not null default now()
);
alter table public.playlist_tracks enable row level security;
create index playlist_tracks_pos_idx on public.playlist_tracks(playlist_id, position);

create policy "pt_select" on public.playlist_tracks for select
  using (public.can_view_playlist(playlist_id, auth.uid()));
create policy "pt_insert" on public.playlist_tracks for insert
  with check (public.can_edit_playlist(playlist_id, auth.uid()));
create policy "pt_update" on public.playlist_tracks for update
  using (public.can_edit_playlist(playlist_id, auth.uid()));
create policy "pt_delete" on public.playlist_tracks for delete
  using (public.can_edit_playlist(playlist_id, auth.uid()));

-- LIKED TRACKS
create table public.liked_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('audius','uploaded')),
  track_key text not null,
  title text not null,
  artist text,
  cover_url text,
  duration_seconds int,
  stream_url text,
  liked_at timestamptz not null default now(),
  primary key (user_id, source, track_key)
);
alter table public.liked_tracks enable row level security;
create policy "likes_own" on public.liked_tracks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index likes_user_idx on public.liked_tracks(user_id, liked_at desc);

-- FOLLOWS
create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_self" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_self" on public.follows for delete using (auth.uid() = follower_id);

-- HISTORY
create table public.listening_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  track_key text not null,
  title text not null,
  artist text,
  cover_url text,
  played_at timestamptz not null default now()
);
alter table public.listening_history enable row level security;
create policy "hist_own" on public.listening_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index hist_user_idx on public.listening_history(user_id, played_at desc);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values
  ('avatars','avatars',true),
  ('playlist-covers','playlist-covers',true),
  ('audio-uploads','audio-uploads',false)
on conflict (id) do nothing;

-- Storage policies: avatars (public read, owner write in their folder)
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_owner_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_owner_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_owner_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "covers_public_read" on storage.objects for select using (bucket_id = 'playlist-covers');
create policy "covers_owner_write" on storage.objects for insert
  with check (bucket_id = 'playlist-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "covers_owner_update" on storage.objects for update
  using (bucket_id = 'playlist-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "covers_owner_delete" on storage.objects for delete
  using (bucket_id = 'playlist-covers' and auth.uid()::text = (storage.foldername(name))[1]);

-- audio-uploads: private, only owner can read/write own files
create policy "audio_owner_read" on storage.objects for select
  using (bucket_id = 'audio-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "audio_owner_write" on storage.objects for insert
  with check (bucket_id = 'audio-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "audio_owner_update" on storage.objects for update
  using (bucket_id = 'audio-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "audio_owner_delete" on storage.objects for delete
  using (bucket_id = 'audio-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
