import { useEffect, useState } from "react";
import { usePlayer, type Track } from "@/store/player";

export interface OfflineTrack {
  trackKey: string;
  title: string;
  artist: string;
  cached: boolean;
  size?: number;
}

export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [cachedTracks, setCachedTracks] = useState<OfflineTrack[]>([]);
  const [cacheSize, setCacheSize] = useState(0);

  const { queue } = usePlayer();

  // Register Service Worker on mount (only in published build, not Lovable preview)
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    // Only register if not in Lovable's preview iframe
    if (window.self !== window.top) {
      console.info("Service Worker: Skipped (Lovable preview iframe detected)");
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then((reg) => {
          setRegistration(reg);
          console.info("Service Worker registered:", reg);

          // Listen for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New version available
                  console.info("Service Worker update available");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cache the current track for offline playback
  const cacheTrack = (track: Track) => {
    if (!registration?.active) return;

    const messageChannel = new MessageChannel();
    registration.active.postMessage(
      {
        type: "CACHE_TRACK",
        payload: { url: track.streamUrl },
      },
      [messageChannel.port2]
    );

    messageChannel.port1.onmessage = (event) => {
      if (event.data.cached) {
        setCachedTracks((prev) => {
          const existing = prev.find((t) => t.trackKey === track.key);
          if (existing) return prev;
          return [
            ...prev,
            {
              trackKey: track.key,
              title: track.title,
              artist: track.artist || "Unknown",
              cached: true,
            },
          ];
        });
      }
    };
  };

  // Batch cache current queue for offline
  const cacheQueue = () => {
    queue.forEach((track) => {
      if (track.streamUrl) cacheTrack(track);
    });
  };

  // Clear all offline cache
  const clearOfflineCache = () => {
    if (!registration?.active) return;

    const messageChannel = new MessageChannel();
    registration.active.postMessage({ type: "CLEAR_CACHE" }, [messageChannel.port2]);

    messageChannel.port1.onmessage = (event) => {
      if (event.data.cleared) {
        setCachedTracks([]);
        setCacheSize(0);
      }
    };
  };

  // Get total cache size
  const getCacheSize = () => {
    if (!registration?.active) return;

    const messageChannel = new MessageChannel();
    registration.active.postMessage({ type: "GET_CACHE_SIZE" }, [messageChannel.port2]);

    messageChannel.port1.onmessage = (event) => {
      if (event.data.size !== undefined) {
        setCacheSize(event.data.size);
      }
    };
  };

  // Update available Service Worker
  const updateServiceWorker = () => {
    if (!registration?.waiting) return;

    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  };

  return {
    registration,
    isOnline,
    cachedTracks,
    cacheSize,
    cacheTrack,
    cacheQueue,
    clearOfflineCache,
    getCacheSize,
    updateServiceWorker,
  };
}
