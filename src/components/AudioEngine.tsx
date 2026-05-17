// Singleton HTML audio element + crossfade. Mounted ONCE in root layout.
import { useEffect, useRef } from "react";
import { usePlayer, consumeSeek, currentTrack, type Track } from "@/store/player";
import { supabase } from "@/integrations/supabase/client";
import { streamUrl as audiusStream } from "@/lib/audius";
import { config } from "@/lib/config";

const CROSSFADE = config.audio.crossfade ? config.audio.crossfadeSeconds : 0;

// For uploaded tracks, `track.streamUrl` actually stores the storage path.
// Resolve to a short-lived signed URL each time we (re)load the source.
async function resolveStreamUrl(t: Track): Promise<string> {
  if (t.source === "audius") return audiusStream(t.id);
  if (t.source === "preview") {
    if (!t.streamUrl) throw new Error("Missing preview url");
    return t.streamUrl;
  }
  // uploaded
  const path = t.streamUrl ?? "";
  if (!path) throw new Error("Missing storage path");
  const { data, error } = await supabase.storage
    .from("audio-uploads")
    .createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error("signed url failed");
  return data.signedUrl;
}

const loggedKeys = new Set<string>();

export function AudioEngine() {
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const activeRef = useRef<"A" | "B">("A");
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const A = new Audio();
    const B = new Audio();
    A.preload = "auto";
    B.preload = "auto";
    audioARef.current = A;
    audioBRef.current = B;

    const getActive = () => (activeRef.current === "A" ? A : B);
    const getInactive = () => (activeRef.current === "A" ? B : A);

    const onTime = () => {
      const a = getActive();
      const s = usePlayer.getState();
      s.setProgress(a.currentTime);
      if (a.duration && Number.isFinite(a.duration)) s.setDuration(a.duration);

      if (
        CROSSFADE > 0 &&
        a.duration &&
        a.duration - a.currentTime <= CROSSFADE &&
        a.duration - a.currentTime > CROSSFADE - 0.3 &&
        s.repeat !== "one"
      ) {
        const nextIdx = s.shuffle
          ? Math.floor(Math.random() * s.queue.length)
          : s.index + 1 < s.queue.length
            ? s.index + 1
            : s.repeat === "all"
              ? 0
              : -1;
        if (nextIdx >= 0) {
          const nextT = s.queue[nextIdx];
          resolveStreamUrl(nextT).then((url) => {
            const inactive = getInactive();
            inactive.src = url;
            inactive.volume = 0;
            inactive.play().catch(() => {});
            const start = performance.now();
            const fade = () => {
              const t = Math.min(1, (performance.now() - start) / (CROSSFADE * 1000));
              a.volume = (s.muted ? 0 : s.volume) * (1 - t);
              inactive.volume = (s.muted ? 0 : s.volume) * t;
              if (t < 1) requestAnimationFrame(fade);
              else {
                a.pause();
                activeRef.current = activeRef.current === "A" ? "B" : "A";
                usePlayer.setState({ index: nextIdx, progress: 0 });
                lastKeyRef.current = nextT.key;
              }
            };
            requestAnimationFrame(fade);
          }).catch(() => {});
        }
      }
    };

    const onEnded = () => {
      const s = usePlayer.getState();
      const cur = currentTrack(s);
      if (cur && lastKeyRef.current === cur.key) s.next();
    };

    const onLoaded = () => {
      const a = getActive();
      const s = usePlayer.getState();
      if (a.duration && Number.isFinite(a.duration)) s.setDuration(a.duration);
    };

    A.addEventListener("timeupdate", onTime);
    A.addEventListener("ended", onEnded);
    A.addEventListener("loadedmetadata", onLoaded);
    B.addEventListener("timeupdate", onTime);
    B.addEventListener("ended", onEnded);
    B.addEventListener("loadedmetadata", onLoaded);

    return () => {
      A.pause(); B.pause(); A.src = ""; B.src = "";
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const unsub = usePlayer.subscribe((state, prev) => {
      const a = activeRef.current === "A" ? audioARef.current! : audioBRef.current!;
      if (!a) return;

      const cur = currentTrack(state);
      if (cur && cur.key !== lastKeyRef.current) {
        lastKeyRef.current = cur.key;
        resolveStreamUrl(cur)
          .then((url) => {
            if (!mounted) return;
            a.src = url;
            a.currentTime = 0;
            a.volume = state.muted ? 0 : state.volume;
            a.playbackRate = state.playbackRate;
            if (state.isPlaying) a.play().catch(() => {});
            if ("mediaSession" in navigator) {
              navigator.mediaSession.metadata = new MediaMetadata({
                title: cur.title,
                artist: cur.artist || "",
                album: "",
                artwork: cur.coverUrl
                  ? [{ src: cur.coverUrl, sizes: "512x512", type: "image/jpeg" }]
                  : [],
              });
            }
            // History — once per (session, key)
            const histKey = `${cur.source}:${cur.id}`;
            if (!loggedKeys.has(histKey)) {
              loggedKeys.add(histKey);
              supabase.auth.getUser().then(({ data }) => {
                if (!data.user) return;
                supabase.from("listening_history").insert({
                  user_id: data.user.id,
                  source: cur.source,
                  track_key: cur.id,
                  title: cur.title,
                  artist: cur.artist ?? null,
                  cover_url: cur.coverUrl ?? null,
                });
              });
            }
          })
          .catch((e) => console.warn("[audio] resolve fail", e));
        return;
      }

      if (state.isPlaying !== prev.isPlaying) {
        if (state.isPlaying) a.play().catch(() => {});
        else a.pause();
      }
      if (state.volume !== prev.volume || state.muted !== prev.muted) {
        a.volume = state.muted ? 0 : state.volume;
      }
      if (state.playbackRate !== prev.playbackRate) {
        a.playbackRate = state.playbackRate;
      }
      if (state.sinkId !== prev.sinkId && state.sinkId != null) {
        const anyA = a as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
        if (typeof anyA.setSinkId === "function") {
          anyA.setSinkId(state.sinkId).catch(() => {});
        }
      }
      const seek = consumeSeek();
      if (seek != null && Number.isFinite(seek)) a.currentTime = seek;
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => usePlayer.getState().setIsPlaying(true));
      navigator.mediaSession.setActionHandler("pause", () => usePlayer.getState().setIsPlaying(false));
      navigator.mediaSession.setActionHandler("previoustrack", () => usePlayer.getState().prev());
      navigator.mediaSession.setActionHandler("nexttrack", () => usePlayer.getState().next());
      navigator.mediaSession.setActionHandler("seekto", (d) => {
        if (d.seekTime != null) usePlayer.getState().seek(d.seekTime);
      });
    }

    return () => { mounted = false; unsub(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        usePlayer.getState().togglePlay();
      } else if (e.code === "ArrowRight" && e.shiftKey) usePlayer.getState().next();
      else if (e.code === "ArrowLeft" && e.shiftKey) usePlayer.getState().prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
