// Global player state. The audio element lives in <AudioEngine /> mounted in the
// root layout, so playback persists across navigation. All UI controls dispatch
// here; the engine reads state and drives <audio>.
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TrackSource = "audius" | "uploaded" | "preview";

export interface Track {
  // Stable key: `${source}:${id}`
  key: string;
  source: TrackSource;
  id: string; // audius track id OR uploaded_tracks.id
  title: string;
  artist?: string;
  coverUrl?: string;
  durationSeconds?: number;
  // For uploaded tracks the streamUrl is resolved (signed) when played.
  // For Audius it's the discovery stream endpoint.
  streamUrl?: string;
}

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  queue: Track[];
  index: number;
  isPlaying: boolean;
  progress: number; // seconds
  duration: number; // seconds
  volume: number; // 0..1
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  sinkId: string | null;

  // setters
  playNow: (t: Track | Track[], startIndex?: number) => void;
  enqueue: (t: Track | Track[]) => void;
  playNext: (t: Track) => void;
  removeAt: (i: number) => void;
  clearQueue: () => void;
  jumpTo: (i: number) => void;
  togglePlay: () => void;
  setIsPlaying: (b: boolean) => void;
  next: () => void;
  prev: () => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  seek: (p: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSinkId: (id: string | null) => void;
}

// Seek requests from UI → engine reads + clears
let _seekRequest: number | null = null;
export const consumeSeek = (): number | null => {
  const v = _seekRequest;
  _seekRequest = null;
  return v;
};

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 0.8,
      muted: false,
      shuffle: false,
      repeat: "off",
      sinkId: null,

      playNow: (t, startIndex = 0) => {
        const tracks = Array.isArray(t) ? t : [t];
        set({ queue: tracks, index: Math.min(startIndex, tracks.length - 1), isPlaying: true, progress: 0 });
      },
      enqueue: (t) => {
        const tracks = Array.isArray(t) ? t : [t];
        const { queue, index } = get();
        const nextQueue = [...queue, ...tracks];
        set({ queue: nextQueue, index: index < 0 ? 0 : index, isPlaying: get().isPlaying || index < 0 });
      },
      playNext: (t) => {
        const { queue, index } = get();
        const i = Math.max(0, index);
        const nq = [...queue.slice(0, i + 1), t, ...queue.slice(i + 1)];
        set({ queue: nq });
      },
      removeAt: (i) => {
        const { queue, index } = get();
        const nq = queue.filter((_, idx) => idx !== i);
        let ni = index;
        if (i < index) ni--;
        else if (i === index) ni = Math.min(index, nq.length - 1);
        set({ queue: nq, index: ni, isPlaying: nq.length > 0 ? get().isPlaying : false });
      },
      clearQueue: () => set({ queue: [], index: -1, isPlaying: false, progress: 0, duration: 0 }),
      jumpTo: (i) => set({ index: i, isPlaying: true, progress: 0 }),
      togglePlay: () => set({ isPlaying: !get().isPlaying }),
      setIsPlaying: (b) => set({ isPlaying: b }),
      next: () => {
        const { queue, index, repeat, shuffle } = get();
        if (queue.length === 0) return;
        if (repeat === "one") {
          _seekRequest = 0;
          set({ progress: 0, isPlaying: true });
          return;
        }
        if (shuffle) {
          let ni = index;
          if (queue.length > 1) while (ni === index) ni = Math.floor(Math.random() * queue.length);
          set({ index: ni, progress: 0, isPlaying: true });
          return;
        }
        const ni = index + 1;
        if (ni >= queue.length) {
          if (repeat === "all") set({ index: 0, progress: 0, isPlaying: true });
          else set({ isPlaying: false });
          return;
        }
        set({ index: ni, progress: 0, isPlaying: true });
      },
      prev: () => {
        const { queue, index, progress } = get();
        if (queue.length === 0) return;
        if (progress > 3) {
          _seekRequest = 0;
          set({ progress: 0 });
          return;
        }
        const ni = Math.max(0, index - 1);
        set({ index: ni, progress: 0, isPlaying: true });
      },
      setProgress: (p) => set({ progress: p }),
      setDuration: (d) => set({ duration: d }),
      seek: (p) => {
        _seekRequest = p;
        set({ progress: p });
      },
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), muted: false }),
      toggleMute: () => set({ muted: !get().muted }),
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () =>
        set({ repeat: get().repeat === "off" ? "all" : get().repeat === "all" ? "one" : "off" }),
      setSinkId: (id) => set({ sinkId: id }),
    }),
    {
      name: "auralis-player",
      partialize: (s) => ({
        queue: s.queue,
        index: s.index,
        volume: s.volume,
        muted: s.muted,
        shuffle: s.shuffle,
        repeat: s.repeat,
        sinkId: s.sinkId,
      }),
    }
  )
);

export const currentTrack = (s: PlayerState): Track | undefined =>
  s.index >= 0 && s.index < s.queue.length ? s.queue[s.index] : undefined;
