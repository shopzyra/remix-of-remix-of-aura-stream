import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon, Play, Podcast as PodcastIcon } from "lucide-react";
import { usePlayer, type Track } from "@/store/player";
import { TrackMenu } from "@/components/AddToPlaylistMenu";

export const Route = createFileRoute("/_app/podcasts")({
  component: PodcastsPage,
});

interface Show {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl600?: string;
  artworkUrl100?: string;
  feedUrl?: string;
  primaryGenreName?: string;
}

interface Episode {
  guid: string;
  title: string;
  audioUrl: string;
  durationSeconds?: number;
  pubDate?: string;
  description?: string;
}

async function searchShows(q: string): Promise<Show[]> {
  if (!q.trim()) return [];
  const u = new URL("https://itunes.apple.com/search");
  u.searchParams.set("term", q);
  u.searchParams.set("media", "podcast");
  u.searchParams.set("limit", "20");
  const r = await fetch(u.toString());
  if (!r.ok) return [];
  const j = (await r.json()) as { results: Show[] };
  return j.results ?? [];
}

async function topShows(): Promise<Show[]> {
  // iTunes top podcasts JSON feed
  const r = await fetch("https://itunes.apple.com/us/rss/toppodcasts/limit=20/json");
  if (!r.ok) return [];
  const j = await r.json();
  type Entry = {
    id: { attributes: { "im:id": string } };
    "im:name": { label: string };
    "im:artist": { label: string };
    "im:image": Array<{ label: string }>;
  };
  return ((j?.feed?.entry ?? []) as Entry[]).map((e) => ({
    collectionId: Number(e.id.attributes["im:id"]),
    collectionName: e["im:name"].label,
    artistName: e["im:artist"].label,
    artworkUrl600: e["im:image"][e["im:image"].length - 1]?.label,
  }));
}

async function fetchEpisodes(feedUrl: string): Promise<Episode[]> {
  // CORS proxy for RSS feeds
  const proxy = `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`;
  const r = await fetch(proxy);
  if (!r.ok) return [];
  const text = await r.text();
  const xml = new DOMParser().parseFromString(text, "application/xml");
  const items = Array.from(xml.querySelectorAll("item"));
  return items.slice(0, 50).map((item) => {
    const enc = item.querySelector("enclosure");
    const audioUrl = enc?.getAttribute("url") ?? "";
    const durRaw = item.getElementsByTagNameNS("*", "duration")[0]?.textContent ?? "";
    let dur: number | undefined;
    if (/^\d+$/.test(durRaw)) dur = Number(durRaw);
    else if (durRaw.includes(":")) {
      const parts = durRaw.split(":").map(Number);
      dur = parts.reduce((a, b) => a * 60 + b, 0);
    }
    return {
      guid: item.querySelector("guid")?.textContent ?? audioUrl,
      title: item.querySelector("title")?.textContent ?? "Untitled",
      audioUrl,
      durationSeconds: dur,
      pubDate: item.querySelector("pubDate")?.textContent ?? undefined,
      description: item.querySelector("description")?.textContent ?? undefined,
    };
  }).filter((e) => !!e.audioUrl);
}

function PodcastsPage() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [show, setShow] = useState<Show | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const top = useQuery({ queryKey: ["podcasts", "top"], queryFn: topShows, staleTime: 30 * 60_000 });
  const results = useQuery({
    queryKey: ["podcasts", "search", debounced],
    queryFn: () => searchShows(debounced),
    enabled: debounced.length >= 2,
  });
  const episodes = useQuery({
    queryKey: ["podcasts", "episodes", show?.feedUrl],
    queryFn: () => fetchEpisodes(show!.feedUrl!),
    enabled: !!show?.feedUrl,
  });

  const { playNow, enqueue } = usePlayer();
  const shows = debounced.length >= 2 ? (results.data ?? []) : (top.data ?? []);

  const episodeToTrack = (ep: Episode): Track => ({
    key: `preview:podcast-${ep.guid}`,
    source: "preview",
    id: ep.guid,
    title: ep.title,
    artist: show?.collectionName,
    coverUrl: show?.artworkUrl600 ?? show?.artworkUrl100,
    durationSeconds: ep.durationSeconds,
    streamUrl: ep.audioUrl,
  });

  if (show) {
    return (
      <div className="space-y-6">
        <button onClick={() => setShow(null)} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to podcasts
        </button>
        <header className="flex items-end gap-6">
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-surface-2 shadow-glow">
            {show.artworkUrl600 || show.artworkUrl100 ? (
              <img src={show.artworkUrl600 ?? show.artworkUrl100!} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="h-full w-full gradient-brand" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Podcast</p>
            <h1 className="truncate text-3xl font-extrabold tracking-tight">{show.collectionName}</h1>
            <p className="text-sm text-muted-foreground">{show.artistName}</p>
          </div>
        </header>
        {episodes.isLoading && <p className="text-sm text-muted-foreground">Loading episodes…</p>}
        {!show.feedUrl && (
          <p className="text-sm text-muted-foreground">Episode feed unavailable for this show.</p>
        )}
        <div className="space-y-1">
          {(episodes.data ?? []).map((ep, i, arr) => {
            const all = arr.map(episodeToTrack);
            const t = all[i];
            return (
              <div key={ep.guid} className="group flex items-center gap-3 rounded-lg p-2 hover:bg-surface-1">
                <button onClick={() => playNow(all, i)} className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary">
                  <Play className="h-4 w-4 fill-current" />
                </button>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium">{ep.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {ep.pubDate ? new Date(ep.pubDate).toLocaleDateString() : ""}
                    {ep.durationSeconds ? ` · ${Math.round(ep.durationSeconds / 60)} min` : ""}
                  </div>
                </div>
                <button
                  onClick={() => enqueue(t)}
                  className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  Queue
                </button>
                <TrackMenu track={t} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <PodcastIcon className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-extrabold tracking-tight">Podcasts</h1>
      </header>
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
        <SearchIcon className="h-5 w-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search podcasts…"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
      <h2 className="text-lg font-bold">{debounced.length >= 2 ? "Results" : "Top podcasts"}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {shows.map((s) => (
          <button
            key={s.collectionId}
            onClick={() => setShow(s)}
            className="group text-left"
          >
            <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-surface-2 transition group-hover:scale-[1.02]">
              {s.artworkUrl600 || s.artworkUrl100 ? (
                <img src={s.artworkUrl600 ?? s.artworkUrl100!} loading="lazy" className="h-full w-full object-cover" alt="" />
              ) : (
                <div className="h-full w-full gradient-brand" />
              )}
            </div>
            <div className="truncate text-sm font-medium">{s.collectionName}</div>
            <div className="truncate text-xs text-muted-foreground">{s.artistName}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
