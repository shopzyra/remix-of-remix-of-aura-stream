import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { trending, undergroundTrending, bestArtwork, type AudiusTrack } from "@/lib/audius";
import { usePlayer, type Track } from "@/store/player";
import { useUser } from "@/hooks/use-user";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration } from "@/lib/format";

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

  const week = useQuery({ queryKey: ["trending", "week"], queryFn: () => trending("week") });
  const under = useQuery({ queryKey: ["trending", "under"], queryFn: undergroundTrending });

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
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fresh sounds picked for you.</p>
      </header>

      {recent.data && recent.data.length > 0 && (
        <Section title="Recently played">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recent.data.slice(0, 8).map((r) => (
              <Link
                key={r.id}
                to="/search"
                search={{ q: r.title }}
                className="glass flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-2"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded">
                  {r.cover_url ? (
                    <img src={r.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.artist}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Trending this week">
        <TrackRow tracks={week.data?.map(toTrack) ?? []} loading={week.isLoading} />
      </Section>

      <Section title="Underground gems">
        <TrackRow tracks={under.data?.map(toTrack) ?? []} loading={under.isLoading} />
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function TrackRow({ tracks, loading }: { tracks: Track[]; loading: boolean }) {
  const { playNow } = usePlayer();
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square animate-pulse rounded-xl bg-surface-2" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {tracks.slice(0, 10).map((t, i) => (
        <button
          key={t.key}
          onClick={() => playNow(tracks, i)}
          className="group text-left"
        >
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-2 shadow-lg">
            {t.coverUrl ? (
              <img src={t.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
            ) : (
              <div className="h-full w-full gradient-brand" />
            )}
            <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-brand text-primary-foreground shadow-glow">
                <Play className="h-4 w-4 fill-current" />
              </div>
            </div>
          </div>
          <div className="truncate text-sm font-semibold">{t.title}</div>
          <div className="truncate text-xs text-muted-foreground">{t.artist} · {formatDuration(t.durationSeconds)}</div>
        </button>
      ))}
    </div>
  );
}
