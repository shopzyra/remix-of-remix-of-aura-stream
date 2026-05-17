import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Upload, History, ListMusic, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { usePlayer, type Track } from "@/store/player";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_app/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = useUser();

  const playlists = useQuery({
    queryKey: ["library", "playlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("owner_id", user!.id)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });
  const uploads = useQuery({
    queryKey: ["library", "uploads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("uploaded_tracks")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Your library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you've saved, uploaded and played.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile to="/liked" icon={<Heart className="h-5 w-5" />} title="Liked tracks" />
        <Tile to="/playlists" icon={<ListMusic className="h-5 w-5" />} title="Playlists" />
        <Tile to="/history" icon={<History className="h-5 w-5" />} title="History" />
        <Tile to="/upload" icon={<Upload className="h-5 w-5" />} title="Upload" />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Your playlists</h2>
        {(playlists.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No playlists yet.{" "}
            <Link to="/playlists" className="text-primary hover:underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(playlists.data ?? []).map((p) => (
              <Link key={p.id} to="/playlists/$id" params={{ id: p.id }} className="group">
                <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-surface-2">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center gradient-brand">
                      <ListMusic className="h-8 w-8 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.is_public ? "Public" : "Private"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Your uploads</h2>
        <UploadsList data={uploads.data ?? []} />
      </section>
    </div>
  );
}

function Tile({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to} className="glass flex items-center gap-3 rounded-xl p-3 transition hover:bg-surface-2">
      <div className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground">
        {icon}
      </div>
      <span className="text-sm font-semibold">{title}</span>
    </Link>
  );
}

function UploadsList({ data }: { data: any[] }) {
  const { playNow } = usePlayer();
  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Upload your own MP3s from <Link to="/upload" className="text-primary hover:underline">the upload page</Link>.
      </p>
    );
  const tracks: Track[] = data.map((u) => ({
    key: `uploaded:${u.id}`,
    source: "uploaded",
    id: u.id,
    title: u.title,
    artist: u.artist ?? undefined,
    coverUrl: u.cover_url ?? undefined,
    durationSeconds: u.duration_seconds ?? undefined,
    streamUrl: u.storage_path,
  }));
  return (
    <div className="space-y-1">
      {tracks.map((t, i) => (
        <button
          key={t.key}
          onClick={() => playNow(tracks, i)}
          className="group flex w-full items-center gap-3 rounded-lg p-2 hover:bg-surface-1"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded gradient-brand text-primary-foreground">
            <Play className="h-4 w-4 fill-current" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-medium">{t.title}</div>
            <div className="truncate text-xs text-muted-foreground">{t.artist || "Unknown artist"}</div>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(t.durationSeconds)}
          </span>
        </button>
      ))}
    </div>
  );
}
