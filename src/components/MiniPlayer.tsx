import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  Maximize2,
  ListMusic,
  Speaker,
  Wifi,
  WifiOff,
} from "lucide-react";
import { usePlayer, currentTrack } from "@/store/player";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { formatDuration } from "@/lib/format";
import { FullPlayer } from "./FullPlayer";
import { QueueDrawer } from "./QueueDrawer";
import { DeviceMenu } from "./DeviceMenu";
import { LikeButton } from "./LikeButton";
import { config } from "@/lib/config";

export function MiniPlayer() {
  const state = usePlayer();
  const track = currentTrack(state);
  const { isOnline, cacheTrack } = useServiceWorker();
  const [full, setFull] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  // Early return AFTER all hooks
  if (!track) return null;

  const VolIcon = state.muted || state.volume === 0 ? VolumeX : state.volume < 0.5 ? Volume1 : Volume2;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          state.togglePlay();
          break;
        case "ArrowRight":
          if (e.shiftKey) {
            e.preventDefault();
            state.next();
          }
          break;
        case "ArrowLeft":
          if (e.shiftKey) {
            e.preventDefault();
            state.prev();
          }
          break;
        case "KeyD":
          if (isOnline && track.streamUrl) {
            e.preventDefault();
            cacheTrack(track);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, track, isOnline, cacheTrack]);

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="glass fixed inset-x-2 bottom-16 z-40 rounded-2xl px-3 py-2 shadow-glow md:bottom-2 md:left-[17rem] md:right-4 md:inset-x-auto"
      >
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3 md:gap-6">
          {/* Track info */}
          <button
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => setFull(true)}
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-brand" />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{track.title}</div>
              <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
            </div>
            <LikeButton track={track} className="ml-2 hidden md:inline-flex" />
            {!isOnline && <WifiOff className="h-4 w-4 text-amber-500 shrink-0 hidden md:block" />}
          </button>

          {/* Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => state.toggleShuffle()}
                className={`hidden p-1.5 md:block ${state.shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={() => state.prev()} className="p-1.5 text-muted-foreground hover:text-foreground transition active:scale-90" aria-label="Previous">
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              <button
                onClick={() => state.togglePlay()}
                className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background transition hover:scale-105 active:scale-95"
                aria-label={state.isPlaying ? "Pause" : "Play"}
              >
                {state.isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
              </button>
              <button onClick={() => state.next()} className="p-1.5 text-muted-foreground hover:text-foreground transition active:scale-90" aria-label="Next">
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
              <button
                onClick={() => state.cycleRepeat()}
                className={`hidden p-1.5 md:block transition ${state.repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label="Repeat"
              >
                {state.repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>
            <div className="hidden w-full items-center gap-2 text-[10px] text-muted-foreground md:flex">
              <span className="tabular-nums">{formatDuration(state.progress)}</span>
              <ProgressBar />
              <span className="tabular-nums">{formatDuration(state.duration || track.durationSeconds)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setQueueOpen(true)}
              className="hidden p-1.5 text-muted-foreground hover:text-foreground md:block"
              aria-label="Queue"
            >
              <ListMusic className="h-4 w-4" />
            </button>
            {config.audio.deviceSwitching && <DeviceMenu />}
            <div className="hidden items-center gap-2 md:flex">
              <button onClick={() => state.toggleMute()} className="p-1.5 text-muted-foreground hover:text-foreground transition" aria-label="Mute">
                <VolIcon className="h-4 w-4" />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.muted ? 0 : state.volume}
                onChange={(e) => state.setVolume(Number(e.target.value))}
                className="h-1 w-20 accent-primary"
              />
            </div>
            <button
              onClick={() => setFull(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition"
              aria-label="Expand"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Mobile progress */}
        <div className="mt-2 flex w-full items-center gap-2 text-[10px] text-muted-foreground md:hidden">
          <span className="tabular-nums">{formatDuration(state.progress)}</span>
          <ProgressBar />
          <span className="tabular-nums">{formatDuration(state.duration || track.durationSeconds)}</span>
        </div>
      </motion.div>

      <AnimatePresence>{full && <FullPlayer onClose={() => setFull(false)} />}</AnimatePresence>
      <AnimatePresence>{queueOpen && <QueueDrawer onClose={() => setQueueOpen(false)} />}</AnimatePresence>
    </>
  );
}

function ProgressBar() {
  const { progress, duration, seek } = usePlayer();
  const max = duration || 1;
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={0.1}
      value={Math.min(progress, max)}
      onChange={(e) => seek(Number(e.target.value))}
      className="h-1 flex-1 accent-primary"
    />
  );
}
