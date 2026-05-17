// Lightweight Audius API client. Audius is a free, legal, open music catalog
// with a public discovery API. https://docs.audius.org/

import { config } from "./config";

const APP = config.catalog.audiusApp || "auralis";

let cachedHost: string | null = null;
let cachedAt = 0;

async function getHost(): Promise<string> {
  // Cache discovery node for 10 minutes
  if (cachedHost && Date.now() - cachedAt < 600_000) return cachedHost;
  try {
    const r = await fetch("https://api.audius.co");
    const j = (await r.json()) as { data: string[] };
    const host = j.data?.[Math.floor(Math.random() * j.data.length)];
    if (!host) throw new Error("no host");
    cachedHost = host;
    cachedAt = Date.now();
    return host;
  } catch {
    cachedHost = "https://discoveryprovider.audius.co";
    cachedAt = Date.now();
    return cachedHost;
  }
}

export interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string };
  user: { id: string; handle: string; name: string };
  genre?: string;
  play_count?: number;
}

export interface AudiusUser {
  id: string;
  handle: string;
  name: string;
  profile_picture?: { "150x150"?: string; "480x480"?: string };
  follower_count?: number;
}

export interface AudiusPlaylist {
  id: string;
  playlist_name: string;
  artwork?: { "150x150"?: string; "480x480"?: string };
  user: { id: string; handle: string; name: string };
  total_play_count?: number;
}

async function api<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const host = await getHost();
  const u = new URL(`${host}/v1${path}`);
  u.searchParams.set("app_name", APP);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`Audius ${r.status}`);
  const j = (await r.json()) as { data: T };
  return j.data;
}

export async function trending(time: "week" | "month" | "year" = "week") {
  return api<AudiusTrack[]>("/tracks/trending", { time });
}
export async function undergroundTrending() {
  return api<AudiusTrack[]>("/tracks/trending/underground");
}
export async function searchTracks(query: string) {
  if (!query.trim()) return [];
  return api<AudiusTrack[]>("/tracks/search", { query });
}
export async function searchUsers(query: string) {
  if (!query.trim()) return [];
  return api<AudiusUser[]>("/users/search", { query });
}
export async function searchPlaylists(query: string) {
  if (!query.trim()) return [];
  return api<AudiusPlaylist[]>("/playlists/search", { query });
}
export async function getTrack(id: string) {
  return api<AudiusTrack>(`/tracks/${id}`);
}

export async function streamUrl(trackId: string): Promise<string> {
  const host = await getHost();
  return `${host}/v1/tracks/${trackId}/stream?app_name=${APP}`;
}

export function bestArtwork(t: Pick<AudiusTrack, "artwork">) {
  return t.artwork?.["1000x1000"] || t.artwork?.["480x480"] || t.artwork?.["150x150"] || "";
}
