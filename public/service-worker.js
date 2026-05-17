// Service Worker for offline downloads and caching
// This only works in published builds (not Lovable's preview iframe)
// Handles track caching, offline playback, and background sync

const CACHE_VERSION = "v1";
const CACHE_NAMES = {
  TRACKS: `auralis-tracks-${CACHE_VERSION}`,
  COVERS: `auralis-covers-${CACHE_VERSION}`,
  APP: `auralis-app-${CACHE_VERSION}`,
};

// Files to cache on install
const APP_CACHE_URLS = [
  "/",
  "/home",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];

/**
 * Service Worker install event - cache core app files
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.APP).then((cache) => {
      return cache.addAll(APP_CACHE_URLS).catch(() => {
        // Fail gracefully if some URLs don't exist yet
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

/**
 * Service Worker activate event - cleanup old caches
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Delete old cache versions
          if (!Object.values(CACHE_NAMES).includes(key)) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Service Worker fetch event - cache tracks, covers, and provide offline fallback
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome extensions and other schemes
  if (!url.protocol.startsWith("http")) return;

  // Cache audio tracks (Audius, YouTube, previews)
  if (
    url.hostname.includes("audius") ||
    url.hostname.includes("youtube") ||
    url.hostname.includes("itunes.apple.com") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".m4a") ||
    url.pathname.endsWith(".webm") ||
    url.pathname.includes("/audio-uploads/")
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) return response;
          return fetch(request)
            .then((response) => {
              // Only cache successful responses
              if (!response || response.status !== 200 || response.type !== "basic") {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAMES.TRACKS).then((cache) => {
                cache.put(request, responseToCache);
              });
              return response;
            })
            .catch(() => {
              // Return cached version if fetch fails, or error response
              return caches.match(request) || new Response("Offline - track not cached", { status: 503 });
            });
        })
        .catch(() => new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Cache cover images
  if (url.pathname.includes("image") || url.pathname.match(/\.(jpg|png|webp|svg)$/i)) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) return response;
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) return response;
              const responseToCache = response.clone();
              caches.open(CACHE_NAMES.COVERS).then((cache) => {
                cache.put(request, responseToCache);
              });
              return response;
            })
            .catch(() => {
              // Serve placeholder for missing covers
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#2a2a2a" width="100" height="100"/><circle cx="50" cy="50" r="30" fill="#555"/></svg>',
                {
                  headers: { "Content-Type": "image/svg+xml" },
                }
              );
            });
        })
        .catch(() => new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Cache app shell (HTML, JS, CSS)
  if (
    url.pathname === "/" ||
    url.pathname.match(/\.(html|js|css)$/i) ||
    request.mode === "navigate"
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          return (
            response ||
            fetch(request)
              .then((response) => {
                if (!response || response.status !== 200 || response.type !== "basic") {
                  return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAMES.APP).then((cache) => {
                  cache.put(request, responseToCache);
                });
                return response;
              })
              .catch(() => {
                // Return app shell for offline navigation
                return caches.match("/") || new Response("Offline", { status: 503 });
              })
          );
        })
        .catch(() => new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200) return response;
        const responseToCache = response.clone();
        caches
          .open(CACHE_NAMES.APP)
          .then((cache) => {
            cache.put(request, responseToCache);
          })
          .catch(() => {});
        return response;
      })
      .catch(() => {
        return caches.match(request) || new Response("Offline", { status: 503 });
      })
  );
});

/**
 * Handle messages from the client (e.g., clear cache, check version)
 */
self.addEventListener("message", (event) => {
  const { type, payload } = event.data;

  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (type === "CLEAR_CACHE") {
    event.waitUntil(
      Promise.all([
        caches.delete(CACHE_NAMES.TRACKS),
        caches.delete(CACHE_NAMES.COVERS),
        caches.delete(CACHE_NAMES.APP),
      ]).then(() => {
        event.ports[0]?.postMessage({ cleared: true });
      })
    );
  }

  if (type === "CACHE_TRACK") {
    const { url } = payload;
    event.waitUntil(
      caches.open(CACHE_NAMES.TRACKS).then((cache) => {
        return fetch(url)
          .then((response) => {
            if (response.ok) {
              cache.put(url, response.clone());
              event.ports[0]?.postMessage({ cached: true, url });
            }
          })
          .catch((err) => {
            event.ports[0]?.postMessage({ cached: false, error: err.message });
          });
      })
    );
  }

  if (type === "GET_CACHE_SIZE") {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        let totalSize = 0;
        for (const key of keys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          for (const request of requests) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
        }
        event.ports[0]?.postMessage({ size: totalSize });
      })()
    );
  }
});
