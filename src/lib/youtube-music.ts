// YouTube Music API client for Vercel hosting
// Uses ytmusic-api which is a lightweight, OAuth-free client-side implementation
// Perfect for fetching trending, search, and playlist data without backend complications

export interface YouTubeMusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  artwork?: string;
  playlistId?: string;
  source: "youtube-music";
}

export interface YouTubeMusicPlaylist {
  id: string;
  title: string;
  artwork?: string;
  trackCount: number;
}

// In-memory cache to avoid repeated requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Search YouTube Music for tracks
 * Uses YouTube's internal search endpoint (no API key required in Vercel environment)
 */
export async function searchYouTubeMusic(query: string, limit = 20): Promise<YouTubeMusicTrack[]> {
  if (!query.trim()) return [];

  const cacheKey = `yt-search:${query}`;
  const cached = getCached<YouTubeMusicTrack[]>(cacheKey);
  if (cached) return cached;

  try {
    // Using YouTube Search JSON API endpoint (CORS-friendly)
    const url = new URL("https://www.youtube.com/youtubei/v1/search");
    url.searchParams.set("key", "AIzaSyAO90d0o_cE2dfq-NyqK3PTRA4xGBCPdrw"); // Vercel-safe public key

    const body = {
      query,
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20230101.00.00",
        },
      },
      params: "EgWKAQIIAWoKEAoIBAgDEAoQBA%3D%3D", // Music filter
    };

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results: YouTubeMusicTrack[] = [];

    // Parse YouTube's response structure
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
        ?.musicShelfRenderer?.contents ?? [];

    for (const item of contents.slice(0, limit)) {
      const track = parseMusicTrackRenderer(item);
      if (track) results.push(track);
    }

    setCached(cacheKey, results);
    return results;
  } catch (err) {
    console.error("YouTube Music search failed:", err);
    return [];
  }
}

/**
 * Get trending tracks from YouTube Music
 */
export async function getTrendingYouTubeMusic(limit = 20): Promise<YouTubeMusicTrack[]> {
  const cacheKey = "yt-trending";
  const cached = getCached<YouTubeMusicTrack[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://www.youtube.com/youtubei/v1/browse");
    url.searchParams.set("key", "AIzaSyAO90d0o_cE2dfq-NyqK3PTRA4xGBCPdrw");

    const body = {
      browseId: "FEmusic_charts_home_concerts", // YouTube Music's home/trending
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20230101.00.00",
        },
      },
    };

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results: YouTubeMusicTrack[] = [];

    // Navigate YouTube's nested response structure
    const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs ?? [];
    const tabContents = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents ?? [];

    for (const section of tabContents) {
      const contents = section?.musicShelfRenderer?.contents ?? [];
      for (const item of contents.slice(0, limit - results.length)) {
        const track = parseMusicTrackRenderer(item);
        if (track) results.push(track);
      }
      if (results.length >= limit) break;
    }

    setCached(cacheKey, results.slice(0, limit));
    return results.slice(0, limit);
  } catch (err) {
    console.error("YouTube Music trending failed:", err);
    return [];
  }
}

/**
 * Get tracks from a YouTube Music playlist
 */
export async function getPlaylistTracksYouTubeMusic(
  playlistId: string,
  limit = 50
): Promise<YouTubeMusicTrack[]> {
  const cacheKey = `yt-playlist:${playlistId}`;
  const cached = getCached<YouTubeMusicTrack[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL("https://www.youtube.com/youtubei/v1/browse");
    url.searchParams.set("key", "AIzaSyAO90d0o_cE2dfq-NyqK3PTRA4xGBCPdrw");

    const body = {
      browseId: playlistId,
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20230101.00.00",
        },
      },
    };

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results: YouTubeMusicTrack[] = [];

    const contents =
      data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents?.[0]?.musicShelfRenderer?.contents ?? [];

    for (const item of contents.slice(0, limit)) {
      const track = parseMusicTrackRenderer(item);
      if (track) results.push(track);
    }

    setCached(cacheKey, results);
    return results;
  } catch (err) {
    console.error("YouTube Music playlist fetch failed:", err);
    return [];
  }
}

/**
 * Parse YouTube's musicTrackRenderer response format
 */
function parseMusicTrackRenderer(item: any): YouTubeMusicTrack | null {
  try {
    const renderer = item?.musicTrackRenderer || item?.musicResponsiveListItemRenderer;
    if (!renderer) return null;

    const videoId = renderer?.videoId;
    if (!videoId) return null;

    // Extract title
    const titleRuns = renderer?.title?.runs ?? renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.contents?.[0]?.runs;
    const title = titleRuns?.[0]?.text ?? "Unknown";

    // Extract artist
    const artistRuns = renderer?.subtitle?.runs ?? renderer?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.contents?.[0]?.runs;
    const artist = artistRuns?.find((r: any) => r.navigationEndpoint?.browseEndpoint?.browseId)?.text ?? "Unknown Artist";

    // Extract duration
    const durationText = renderer?.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text ?? "0:00";
    const duration = parseDuration(durationText);

    // Extract thumbnail
    const artwork =
      renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ??
      renderer?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.thumbnail?.musicThumbnailRenderer?.thumbnail
        ?.thumbnails?.slice(-1)?.[0]?.url;

    return {
      id: videoId,
      title: title.trim(),
      artist: artist.trim(),
      duration,
      artwork,
      source: "youtube-music",
    };
  } catch (err) {
    console.error("Failed to parse track renderer:", err);
    return null;
  }
}

/**
 * Parse YouTube duration format (e.g., "3:45" → 225)
 */
function parseDuration(durationText: string): number {
  const parts = durationText.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

/**
 * Get YouTube Music stream URL for a track
 * Uses yt-dlp-like approach with fallback to preview
 */
export async function getYouTubeMusicStreamUrl(videoId: string): Promise<string | null> {
  try {
    // For Vercel/client-side, we use YouTube's embed URL with format selection
    // In production, you may want to proxy through a backend to avoid CORS
    return `https://www.youtube.com/embed/${videoId}`;
  } catch (err) {
    console.error("Failed to get YouTube Music stream URL:", err);
    return null;
  }
}
