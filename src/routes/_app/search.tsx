import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Search as SearchIcon, Play, TrendingUp } from "lucide-react";
import {
  searchTracks,
  searchUsers,
  searchPlaylists,
  bestArtwork,
  type AudiusTrack,
} from "@/lib/audius";
import { itunesSearch, bestITunesArt } from "@/lib/itunes";
import { usePlayer, type Track } from "@/store/player";
import { formatDuration } from "@/lib/format";
import { TrackMenu } from "@/components/AddToPlaylistMenu";

const search = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/_app/search")({
  validateSearch: search,
  component: SearchPage,
});

const toTrack = (t: AudiusTrack): Track => ({
  key: `audius:${t.id}`,
  source: "audius",
  id: t.id,
  title: t.title,
  artist: t.user.name,
  coverUrl: bestArtwork(t),
  durationSeconds: t.duration,
});

function SearchPage() {
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const tracks = useQuery({
    queryKey: ["search", "tracks", debounced],
    queryFn: () => searchTracks(debounced),
    enabled: debounced.length >= 2,
  });
  const users = useQuery({
    queryKey: ["search", "users", debounced],
    queryFn: () => searchUsers(debounced),
    enabled: debounced.length >= 2,
  });
  const playlists = useQuery({
    queryKey: ["search", "playlists", debounced],
    queryFn: () => searchPlaylists(debounced),
    enabled: debounced.length >= 2,
  });
  const itunes = useQuery({
    queryKey: ["search", "itunes", debounced],
    queryFn: () => itunesSearch(debounced, 15),
    enabled: debounced.length >= 2,
    staleTime: 10 * 60_000,
  });

  const { playNow } = usePlayer();

  return (
    <div className="space-y-6">
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tracks, artists, playlists…"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      {debounced.length < 2 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-bold">Tracks</h2>
            {tracks.isLoading ? (
              <Skeletons />
            ) : (tracks.data ?? []).length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-1">
                {(tracks.data ?? []).slice(0, 20).map((t, i, arr) => {
                  const all = arr.map(toTrack);
                  return (
                    <button
                      key={t.id}
                      onClick={() => playNow(all, i)}
                      className="group flex w-full items-center gap-3 rounded-lg p-2 hover:bg-surface-1"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded">
                        <img src={bestArtwork(t)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{t.user.name}</div>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(t.duration)}</span>
                      {typeof t.play_count === "number" && t.play_count > 0 && (
                        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                          <TrendingUp className="h-3 w-3" />
                          {formatCount(t.play_count)}
                        </span>
                      )}
                      <TrackMenu track={all[i]} />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Popular (previews)</h2>
            {itunes.isLoading ? (
              <Skeletons />
            ) : (itunes.data ?? []).length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-1">
                {(itunes.data ?? []).map((t, i, arr) => {
                  const all: Track[] = arr.map((x) => ({
                    key: `preview:${x.trackId}`,
                    source: "preview" as const,
                    id: String(x.trackId),
                    title: x.trackName,
                    artist: x.artistName,
                    coverUrl: bestITunesArt(x),
                    durationSeconds: x.trackTimeMillis ? Math.round(x.trackTimeMillis / 1000) : 30,
                    streamUrl: x.previewUrl,
                  }));
                  return (
                    <button
                      key={t.trackId}
                      onClick={() => playNow(all, i)}
                      className="group flex w-full items-center gap-3 rounded-lg p-2 hover:bg-surface-1"
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded">
                        <img src={bestITunesArt(t)} alt="" loading="lazy" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate text-sm font-medium">{t.trackName}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {t.artistName}
                          {t.primaryGenreName ? ` · ${t.primaryGenreName}` : ""}
                        </div>
                      </div>
                      <span className="hidden text-[10px] uppercase tracking-wider text-primary sm:inline">30s</span>
                      <TrackMenu track={all[i]} />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Artists</h2>
            {users.isLoading ? (
              <Skeletons />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {(users.data ?? []).slice(0, 10).map((u) => (
                  <div key={u.id} className="text-center">
                    <div className="mx-auto mb-2 h-24 w-24 overflow-hidden rounded-full bg-surface-2">
                      {u.profile_picture?.["480x480"] ? (
                        <img src={u.profile_picture["480x480"]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-brand" />
                      )}
                    </div>
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-xs text-muted-foreground">@{u.handle}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Playlists</h2>
            {playlists.isLoading ? (
              <Skeletons />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {(playlists.data ?? []).slice(0, 10).map((p) => (
                  <Link
                    key={p.id}
                    to="/audius-playlist/$id"
                    params={{ id: p.id }}
                    className="group"
                  >
                    <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-surface-2 transition group-hover:scale-[1.02]">
                      {p.artwork?.["480x480"] ? (
                        <img src={p.artwork["480x480"]} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full gradient-brand" />
                      )}
                    </div>
                    <div className="truncate text-sm font-medium">{p.playlist_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.user.name}</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function Skeletons() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
function Empty() {
  return <p className="py-8 text-center text-sm text-muted-foreground">No results.</p>;
}
