import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Play, ListMusic } from "lucide-react";
import { playlistTracks, getPlaylist, bestArtwork, type AudiusTrack } from "@/lib/audius";
import { usePlayer, type Track } from "@/store/player";
import { formatDuration } from "@/lib/format";
import { TrackMenu } from "@/components/AddToPlaylistMenu";
import { LikeButton } from "@/components/LikeButton";

export const Route = createFileRoute("/_app/audius-playlist/$id")({
  component: AudiusPlaylistPage,
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

function AudiusPlaylistPage() {
  const { id } = Route.useParams();
  const meta = useQuery({ queryKey: ["audius-playlist", id], queryFn: () => getPlaylist(id) });
  const items = useQuery({
    queryKey: ["audius-playlist", id, "tracks"],
    queryFn: () => playlistTracks(id),
  });
  const tracks = (items.data ?? []).map(toTrack);
  const { playNow } = usePlayer();

  const cover =
    meta.data?.artwork?.["480x480"] ?? meta.data?.artwork?.["150x150"] ?? tracks[0]?.coverUrl;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="grid h-48 w-48 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-brand shadow-glow">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <ListMusic className="h-16 w-16 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Audius playlist</div>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
            {meta.data?.playlist_name ?? "Playlist"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.data?.user?.name ? `by ${meta.data.user.name} · ` : ""}
            {tracks.length} tracks
          </p>
          <div className="mt-4">
            <button
              onClick={() => tracks.length > 0 && playNow(tracks, 0)}
              disabled={tracks.length === 0}
              className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              <Play className="h-4 w-4 fill-current" /> Play all
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-1">
        {items.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
          ))
        ) : tracks.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No tracks.</p>
        ) : (
          tracks.map((t, i) => (
            <div key={t.key} className="group flex items-center gap-3 rounded-lg p-2 hover:bg-surface-1">
              <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              <button onClick={() => playNow(tracks, i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
                  {t.coverUrl ? (
                    <img src={t.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
                </div>
              </button>
              <LikeButton track={t} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(t.durationSeconds)}
              </span>
              <TrackMenu track={t} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}