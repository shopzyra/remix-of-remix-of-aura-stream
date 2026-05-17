import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Music, Flame, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { trending, undergroundTrending, bestArtwork, type AudiusTrack } from "@/lib/audius";
import { itunesTopSongs } from "@/lib/itunes";
import { getTrendingYouTubeMusic, type YouTubeMusicTrack } from "@/lib/youtube-music";
import { usePlayer, type Track } from "@/store/player";
import { useUser } from "@/hooks/use-user";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration } from "@/lib/format";
import { TrackMenu } from "@/components/AddToPlaylistMenu";

export const Route = createFileRoute("/_app/home")({
  component: HomePage,
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

function HomePage() {
  const { user } = useUser();
  const greeting = greet();
  const { isOnline } = useServiceWorker();

  const week = useQuery({ queryKey: ["trending", "week"], queryFn: () => trending("week") });
  const under = useQuery({ queryKey: ["trending", "under"], queryFn: undergroundTrending });
  const yt = useQuery({
    queryKey: ["youtube-music", "trending"],
    queryFn: () => getTrendingYouTubeMusic(15),
  });
  const charts = useQuery({
    queryKey: ["itunes", "top"],
    queryFn: () => itunesTopSongs("us", 20),
    staleTime: 30 * 60_000,
  });

  const recent = useQuery({
    queryKey: ["recent", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("listening_history")
        .select("*")
        .order("played_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-12">
      {/* Hero Header with offline indicator */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">{greeting}</h1>
            <p className="mt-2 text-base text-muted-foreground">
              Discover music across Audius, YouTube, and iTunes charts.
            </p>
          </div>
          {!isOnline && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600"
            >
              📡 Offline Mode
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Recently Played - Personalized */}
      {recent.data && recent.data.length > 0 && (
        <Section title="Recently played" icon={<Sparkles className="h-5 w-5" />}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {recent.data.slice(0, 12).map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to="/search"
                  search={{ q: r.title }}
                  className="glass group relative block overflow-hidden rounded-lg transition hover:ring-1 hover:ring-primary"
                >
                  <div className="aspect-square bg-surface-2">
                    {r.cover_url ? (
                      <img
                        src={r.cover_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full gradient-brand" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-0 p-2 text-xs">
                    <div className="line-clamp-1 font-semibold">{r.title}</div>
                    <div className="line-clamp-1 text-muted-foreground">{r.artist}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Trending on Audius */}
      <Section title="Trending this week" icon={<Flame className="h-5 w-5" />}>
        <TrackRow tracks={week.data?.map(toTrack) ?? []} loading={week.isLoading} source="audius" />
      </Section>

      {/* YouTube Music Trending */}
      {yt.data && yt.data.length > 0 && (
        <Section title="Now on YouTube Music" icon={<Music className="h-5 w-5" />}>
          <TrackRow
            tracks={yt.data.map((t: YouTubeMusicTrack): Track => ({
              key: `youtube-music:${t.id}`,
              source: "youtube-music",
              id: t.id,
              title: t.title,
              artist: t.artist,
              coverUrl: t.artwork,
              durationSeconds: t.duration,
            }))}
            loading={yt.isLoading}
            source="youtube-music"
          />
        </Section>
      )}

      {/* Top Charts with Previews */}
      <Section title="Top charts (previews)" icon={<Flame className="h-5 w-5" />}>
        <TrackRow
          tracks={
            (charts.data ?? []).map((t) => ({
              key: `preview:${t.id}`,
              source: "preview" as const,
              id: t.id,
              title: t.title,
              artist: t.artist,
              coverUrl: t.cover,
              durationSeconds: t.durationSeconds,
              streamUrl: t.previewUrl,
            }))
          }
          loading={charts.isLoading}
          source="preview"
        />
      </Section>

      {/* Underground Gems */}
      <Section title="Underground gems" icon={<Sparkles className="h-5 w-5" />}>
        <TrackRow tracks={under.data?.map(toTrack) ?? []} loading={under.isLoading} source="audius" />
      </Section>
    </div>
  );
}

function greet() {
  const h = new Date().getHours();
  if (h < 5) return "Up late?";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-6 flex items-center gap-3">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="text-2xl font-black tracking-tighter">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function TrackRow({
  tracks,
  loading,
  source,
}: {
  tracks: Track[];
  loading: boolean;
  source?: string;
}) {
  const { playNow, cacheTrack } = usePlayer();
  const { cacheTrack: cacheForOffline } = useServiceWorker();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="space-y-3"
          >
            <div className="aspect-square animate-pulse rounded-xl bg-surface-2" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {tracks.slice(0, 12).map((t, i) => (
        <motion.div
          key={t.key}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="group relative"
        >
          <button
            onClick={() => {
              playNow(tracks, i);
              if (t.streamUrl) {
                cacheForOffline(t);
              }
            }}
            className="relative w-full text-left"
          >
            {/* Cover art with hover effect */}
            <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-surface-2 shadow-md transition-shadow group-hover:shadow-lg group-hover:shadow-primary/20">
              {t.coverUrl ? (
                <img
                  src={t.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full gradient-brand" />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              {/* Play button */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full gradient-brand text-primary-foreground shadow-glow">
                  <Play className="h-5 w-5 fill-current" />
                </div>
              </motion.div>
            </div>

            {/* Track info */}
            <div className="min-w-0 space-y-1">
              <div className="truncate text-sm font-semibold leading-tight">{t.title}</div>
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-xs text-muted-foreground">
                  {t.artist}
                  {t.durationSeconds && ` · ${formatDuration(t.durationSeconds)}`}
                </div>
              </div>
            </div>
          </button>

          {/* Track menu - OUTSIDE button to avoid nesting */}
          <div className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100">
            <TrackMenu track={t} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
