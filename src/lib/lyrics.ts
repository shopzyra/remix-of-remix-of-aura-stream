// Free lyrics via lrclib.net (no API key, ad-free, community-maintained).
// Returns synced (LRC) or plain lyrics, plus a parsed timeline.

export interface LyricsLine { time: number; text: string }
export interface LyricsResult {
  plain?: string;
  synced?: LyricsLine[];
  source: "lrclib" | "none";
}

const cache = new Map<string, LyricsResult>();

export async function fetchLyrics(opts: {
  title: string;
  artist?: string;
  durationSeconds?: number;
}): Promise<LyricsResult> {
  const key = `${opts.artist ?? ""}::${opts.title}`.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const u = new URL("https://lrclib.net/api/get");
    u.searchParams.set("track_name", opts.title);
    if (opts.artist) u.searchParams.set("artist_name", opts.artist);
    if (opts.durationSeconds) u.searchParams.set("duration", String(opts.durationSeconds));
    const r = await fetch(u.toString());
    if (!r.ok) throw new Error(`lrclib ${r.status}`);
    const j = (await r.json()) as { plainLyrics?: string; syncedLyrics?: string };
    const out: LyricsResult = {
      plain: j.plainLyrics ?? undefined,
      synced: j.syncedLyrics ? parseLRC(j.syncedLyrics) : undefined,
      source: "lrclib",
    };
    cache.set(key, out);
    return out;
  } catch {
    // Fall back to search
    try {
      const u = new URL("https://lrclib.net/api/search");
      u.searchParams.set("q", `${opts.artist ?? ""} ${opts.title}`.trim());
      const r = await fetch(u.toString());
      const arr = (await r.json()) as Array<{ plainLyrics?: string; syncedLyrics?: string }>;
      const hit = arr?.[0];
      if (!hit) throw new Error("none");
      const out: LyricsResult = {
        plain: hit.plainLyrics ?? undefined,
        synced: hit.syncedLyrics ? parseLRC(hit.syncedLyrics) : undefined,
        source: "lrclib",
      };
      cache.set(key, out);
      return out;
    } catch {
      const out: LyricsResult = { source: "none" };
      cache.set(key, out);
      return out;
    }
  }
}

function parseLRC(lrc: string): LyricsLine[] {
  const out: LyricsLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const m = raw.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (!m) continue;
    const time = Number(m[1]) * 60 + Number(m[2]);
    out.push({ time, text: m[3].trim() });
  }
  return out.sort((a, b) => a.time - b.time);
}
