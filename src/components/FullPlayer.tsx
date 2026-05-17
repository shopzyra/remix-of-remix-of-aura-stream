import { motion } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Heart } from "lucide-react";
import { usePlayer, currentTrack } from "@/store/player";
import { formatDuration } from "@/lib/format";
import { LikeButton } from "./LikeButton";

export function FullPlayer({ onClose }: { onClose: () => void }) {
  const state = usePlayer();
  const track = currentTrack(state);
  if (!track) return null;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
    >
      {/* Backdrop blur of cover */}
      {track.coverUrl && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-50 blur-3xl"
          style={{ background: `url(${track.coverUrl}) center/cover` }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Now playing</span>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-surface-1" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-surface-2 shadow-glow"
        >
          {track.coverUrl ? (
            <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full gradient-brand" />
          )}
        </motion.div>

        <div className="w-full text-center">
          <h2 className="truncate text-2xl font-bold">{track.title}</h2>
          <p className="truncate text-muted-foreground">{track.artist}</p>
        </div>

        <div className="w-full">
          <input
            type="range"
            min={0}
            max={state.duration || 1}
            step={0.1}
            value={Math.min(state.progress, state.duration || 1)}
            onChange={(e) => state.seek(Number(e.target.value))}
            className="h-1.5 w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatDuration(state.progress)}</span>
            <span>{formatDuration(state.duration || track.durationSeconds)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => state.toggleShuffle()}
            className={state.shuffle ? "text-primary" : "text-muted-foreground"}
            aria-label="Shuffle"
          >
            <Shuffle className="h-5 w-5" />
          </button>
          <button onClick={() => state.prev()} aria-label="Prev">
            <SkipBack className="h-7 w-7 fill-current" />
          </button>
          <button
            onClick={() => state.togglePlay()}
            className="grid h-16 w-16 place-items-center rounded-full gradient-brand text-primary-foreground shadow-glow transition hover:scale-105"
            aria-label={state.isPlaying ? "Pause" : "Play"}
          >
            {state.isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
          </button>
          <button onClick={() => state.next()} aria-label="Next">
            <SkipForward className="h-7 w-7 fill-current" />
          </button>
          <button
            onClick={() => state.cycleRepeat()}
            className={state.repeat !== "off" ? "text-primary" : "text-muted-foreground"}
            aria-label="Repeat"
          >
            {state.repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
          </button>
        </div>

        <LikeButton track={track} size="lg" />
      </div>

      <div className="px-6 pb-8 text-center text-xs text-muted-foreground">Space to play/pause • Shift ⇠/⇢ to skip</div>
    </motion.div>
  );
}
