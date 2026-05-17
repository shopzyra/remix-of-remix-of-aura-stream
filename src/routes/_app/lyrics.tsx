import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import { usePlayer, currentTrack } from "@/store/player";
import { fetchLyrics } from "@/lib/lyrics";

export const Route = createFileRoute("/_app/lyrics")({
  component: LyricsPage,
});

function LyricsPage() {
  const state = usePlayer();
  const track = currentTrack(state);

  const q = useQuery({
    queryKey: ["lyrics", track?.key],
    enabled: !!track,
    queryFn: () =>
      fetchLyrics({
        title: track!.title,
        artist: track!.artist,
        durationSeconds: track!.durationSeconds,
      }),
    staleTime: 1000 * 60 * 30,
  });

  const activeIdx = useMemo(() => {
    if (!q.data?.synced) return -1;
    const lines = q.data.synced;
    let i = -1;
    for (let k = 0; k < lines.length; k++) {
      if (lines[k].time <= state.progress) i = k; else break;
    }
    return i;
  }, [q.data, state.progress]);

  const activeRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIdx]);

  if (!track) {
    return (
      <Empty title="Play something first" sub="Lyrics appear here when a track is playing." />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-xl bg-surface-2">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full gradient-brand" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold">{track.title}</h1>
          <p className="truncate text-sm text-muted-foreground">{track.artist}</p>
        </div>
      </header>

      {q.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-5 w-3/4 animate-pulse rounded bg-surface-2" />
          ))}
        </div>
      ) : q.data?.synced && q.data.synced.length > 0 ? (
        <div className="space-y-2 text-lg">
          {q.data.synced.map((l, i) => (
            <motion.div
              key={i}
              ref={i === activeIdx ? activeRef : null}
              animate={{
                opacity: i === activeIdx ? 1 : 0.45,
                scale: i === activeIdx ? 1.02 : 1,
              }}
              className={`origin-left leading-relaxed transition ${
                i === activeIdx ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {l.text || "♪"}
            </motion.div>
          ))}
        </div>
      ) : q.data?.plain ? (
        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-muted-foreground">
          {q.data.plain}
        </pre>
      ) : (
        <Empty
          title="No lyrics found"
          sub="Lyrics are sourced from the open lrclib.net database."
        />
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Lyrics by <a className="underline" href="https://lrclib.net" target="_blank" rel="noreferrer">lrclib.net</a>
      </p>
    </div>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border p-16 text-center">
      <Music2 className="mb-3 h-10 w-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
