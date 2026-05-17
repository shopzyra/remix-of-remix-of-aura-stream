// iTunes Search API — CORS-friendly, no key, generous free tier.
// Used for popular metadata + 30s previews as a fallback source.
// https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/

export interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
  releaseDate?: string;
}

const BASE = "https://itunes.apple.com";

export function bestITunesArt(t: Pick<ITunesTrack, "artworkUrl100">): string {
  // Bump to 600x600 for crisp covers
  return (t.artworkUrl100 ?? "").replace("100x100bb", "600x600bb");
}

export async function itunesSearch(query: string, limit = 25): Promise<ITunesTrack[]> {
  if (!query.trim()) return [];
  const u = new URL(`${BASE}/search`);
  u.searchParams.set("term", query);
  u.searchParams.set("media", "music");
  u.searchParams.set("entity", "song");
  u.searchParams.set("limit", String(limit));
  const r = await fetch(u.toString());
  if (!r.ok) return [];
  const j = (await r.json()) as { results: ITunesTrack[] };
  return (j.results ?? []).filter((t) => !!t.previewUrl);
}

// Popular charts via iTunes RSS feed.
export interface ITunesChartEntry {
  id: string;
  title: string;
  artist: string;
  cover: string;
  previewUrl: string;
  durationSeconds?: number;
}

export async function itunesTopSongs(country = "us", limit = 25): Promise<ITunesChartEntry[]> {
  // RSS feed is CORS-enabled.
  const url = `https://itunes.apple.com/${country}/rss/topsongs/limit=${limit}/json`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  type Entry = {
    id: { attributes: { "im:id": string } };
    "im:name": { label: string };
    "im:artist": { label: string };
    "im:image": Array<{ label: string }>;
    link: Array<{ attributes: { rel?: string; type?: string; href: string } }>;
    "im:duration"?: { label: string };
  };
  const entries = (j?.feed?.entry ?? []) as Entry[];
  return entries.map((e) => {
    const preview =
      e.link.find((l) => l.attributes.rel === "enclosure" && l.attributes.type?.startsWith("audio"))
        ?.attributes.href ?? "";
    const art = e["im:image"]?.[e["im:image"].length - 1]?.label ?? "";
    return {
      id: e.id.attributes["im:id"],
      title: e["im:name"].label,
      artist: e["im:artist"].label,
      cover: art.replace(/\/\d+x\d+bb\.(jpg|png)/, "/600x600bb.$1"),
      previewUrl: preview,
      durationSeconds: e["im:duration"] ? Math.round(Number(e["im:duration"].label) / 1000) : 30,
    };
  }).filter((t) => !!t.previewUrl);
}