import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Upload, History, ListMusic, Play, Plus, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { usePlayer, type Track } from "@/store/player";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_app/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { user } = useUser();
  const { isOnline, cachedTracks, cacheSize, getCacheSize, clearOfflineCache } = useServiceWorker();

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">Your library</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Organize and access everything you've saved, uploaded, and played.
        </p>
      </motion.header>

      {/* Quick access tiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <QuickAccessTile to="/liked" icon={<Heart className="h-5 w-5" />} title="Liked tracks" />
        <QuickAccessTile to="/playlists" icon={<ListMusic className="h-5 w-5" />} title="Playlists" />
        <QuickAccessTile to="/history" icon={<History className="h-5 w-5" />} title="History" />
        <QuickAccessTile to="/upload" icon={<Upload className="h-5 w-5" />} title="Upload" />
      </motion.div>

      {/* Offline Storage Info */}
      {cachedTracks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-emerald-600">Offline downloads</h3>
              <p className="text-sm text-emerald-600/70">
                {cachedTracks.length} track{cachedTracks.length !== 1 ? "s" : ""} ready to play offline
                {cacheSize > 0 && ` • ${formatBytes(cacheSize)} used`}
              </p>
            </div>
            <button
              onClick={clearOfflineCache}
              className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/30"
            >
              Clear
            </button>
          </div>
        </motion.section>
      )}

      {/* Playlists Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter">Your playlists</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {playlists.data?.length ?? 0} playlist{playlists.data?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            to="/playlists"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" />
            New
          </Link>
        </div>

        {(playlists.data ?? []).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border-2 border-dashed border-border bg-surface-1/50 p-8 text-center"
          >
            <ListMusic className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No playlists yet.{" "}
              <Link to="/playlists" className="text-primary hover:underline">
                Create one
              </Link>
              .
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(playlists.data ?? []).map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to="/playlists/$id"
                  params={{ id: p.id }}
                  className="group"
                >
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-2 shadow-md transition-shadow group-hover:shadow-lg group-hover:shadow-primary/20">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center gradient-brand">
                        <ListMusic className="h-8 w-8 text-primary-foreground" />
                      </div>
                    )}
                    {!p.is_public && (
                      <div className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.is_public ? "Public" : "Private"}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Uploads Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter">Your uploads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {uploads.data?.length ?? 0} track{uploads.data?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
        </div>
        <UploadsList data={uploads.data ?? []} />
      </motion.section>
    </div>
  );
}

function QuickAccessTile({ to, icon, title }: { to: string; icon: React.ReactNode; title: string }) {
  return (
    <Link to={to} className="group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="glass relative flex flex-col items-start justify-between gap-3 rounded-xl p-4 transition hover:ring-1 hover:ring-primary"
      >
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground">
          {icon}
        </div>
        <span className="text-sm font-semibold">{title}</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
      </motion.div>
    </Link>
  );
}

function UploadsList({ data }: { data: any[] }) {
  const { playNow } = usePlayer();

  if (data.length === 0)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border-2 border-dashed border-border bg-surface-1/50 p-8 text-center"
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Upload your own MP3s from{" "}
          <Link to="/upload" className="text-primary hover:underline">
            the upload page
          </Link>
          .
        </p>
      </motion.div>
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
    <div className="space-y-2">
      {tracks.map((t, i) => (
        <motion.button
          key={t.key}
          onClick={() => playNow(tracks, i)}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="glass group flex w-full items-center gap-4 rounded-lg p-3 transition hover:bg-surface-2 active:scale-95"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg gradient-brand text-primary-foreground">
            <Play className="h-5 w-5 fill-current" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-semibold">{t.title}</div>
            <div className="truncate text-xs text-muted-foreground">{t.artist || "Unknown artist"}</div>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatDuration(t.durationSeconds)}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
