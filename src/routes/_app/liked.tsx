import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Play, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { usePlayer, type Track } from "@/store/player";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_app/liked")({
  component: LikedPage,
});

function LikedPage() {
  const { user } = useUser();
  const { playNow } = usePlayer();
  const qc = useQueryClient();

  const liked = useQuery({
    queryKey: ["liked", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("liked_tracks")
        .select("*")
        .order("liked_at", { ascending: false });
      return data ?? [];
    },
  });

  const tracks: Track[] = (liked.data ?? []).map((l) => ({
    key: `${l.source}:${l.track_key}`,
    source: l.source as "audius" | "uploaded",
    id: l.track_key,
    title: l.title,
    artist: l.artist ?? undefined,
    coverUrl: l.cover_url ?? undefined,
    durationSeconds: l.duration_seconds ?? undefined,
    streamUrl: l.stream_url ?? undefined,
  }));

  const unlike = async (source: string, track_key: string) => {
    await supabase
      .from("liked_tracks")
      .delete()
      .eq("user_id", user!.id)
      .eq("source", source)
      .eq("track_key", track_key);
    qc.invalidateQueries({ queryKey: ["liked"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="grid h-48 w-48 place-items-center rounded-2xl gradient-brand shadow-glow">
          <Heart className="h-16 w-16 fill-current text-primary-foreground" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Playlist</div>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">Liked tracks</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tracks.length} tracks</p>
          <button
            onClick={() => tracks.length > 0 && playNow(tracks, 0)}
            disabled={tracks.length === 0}
            className="mt-4 inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            <Play className="h-4 w-4 fill-current" /> Play
          </button>
        </div>
      </header>

      <div className="space-y-1">
        {tracks.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Like tracks from anywhere to see them here.
          </p>
        ) : (
          tracks.map((t, i) => (
            <div key={t.key} className="group flex items-center gap-3 rounded-lg p-2 hover:bg-surface-1">
              <button onClick={() => playNow(tracks, i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
                  {t.coverUrl ? (
                    <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
                </div>
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(t.durationSeconds)}</span>
              <button
                onClick={() => unlike(t.source, t.id)}
                className="text-primary opacity-100"
                aria-label="Unlike"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
