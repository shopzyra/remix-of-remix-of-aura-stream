import { motion } from "framer-motion";
import { X, Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Gauge, Download, Wifi, WifiOff } from "lucide-react";
import { usePlayer, currentTrack } from "@/store/player";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { formatDuration } from "@/lib/format";
import { LikeButton } from "./LikeButton";
import { TrackDetailsDialog } from "./TrackDetailsDialog";

export function FullPlayer({ onClose }: { onClose: () => void }) {
  const state = usePlayer();
  const track = currentTrack(state);
  const { isOnline, cacheTrack, cachedTracks } = useServiceWorker();

  if (!track) return null;

  const isCached = cachedTracks.some((t) => t.trackKey === track.key);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background"
    >
      {/* Dynamic backdrop blur with album art */}
      {track.coverUrl && (
        <>
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl"
            style={{ background: `url(${track.coverUrl}) center/cover` }}
          />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-background/75 to-background" />
        </>
      )}

      {/* Header with close and status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4"
      >
        <motion.span className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-emerald-500" />
              Now playing
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-amber-500" />
              Offline
            </>
          )}
        </motion.span>
        <button
          onClick={onClose}
          className="rounded-full p-2 transition hover:bg-surface-1 active:scale-95"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Main content */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 sm:px-6">
        {/* Album Art */}
        <motion.div
          layoutId={`track-cover-${track.key}`}
          className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-surface-2 shadow-2xl"
        >
          {track.coverUrl ? (
            <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full gradient-brand" />
          )}

          {/* Subtle animation on cover */}
          <motion.div
            animate={{ opacity: state.isPlaying ? [0.3, 0.5, 0.3] : 0.3 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-primary/20"
          />
        </motion.div>

        {/* Track Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex w-full items-start justify-between gap-4 text-center"
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black leading-tight tracking-tighter sm:text-4xl">{track.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{track.artist}</p>
          </div>
          <TrackDetailsDialog track={track} />
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-3"
        >
          <input
            type="range"
            min={0}
            max={state.duration || 1}
            step={0.1}
            value={Math.min(state.progress, state.duration || 1)}
            onChange={(e) => state.seek(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs font-medium text-muted-foreground tabular-nums">
            <span>{formatDuration(state.progress)}</span>
            <span>{formatDuration(state.duration || track.durationSeconds || 0)}</span>
          </div>
        </motion.div>

        {/* Controls - Playback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-8"
        >
          <button
            onClick={() => state.toggleShuffle()}
            className={`transition ${state.shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Shuffle"
          >
            <Shuffle className="h-5 w-5" />
          </button>

          <button
            onClick={() => state.prev()}
            className="transition hover:scale-110 active:scale-95"
            aria-label="Previous"
          >
            <SkipBack className="h-8 w-8 fill-current" />
          </button>

          <motion.button
            onClick={() => state.togglePlay()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="grid h-20 w-20 place-items-center rounded-full gradient-brand text-primary-foreground shadow-glow transition"
            aria-label={state.isPlaying ? "Pause" : "Play"}
          >
            {state.isPlaying ? (
              <Pause className="h-8 w-8 fill-current" />
            ) : (
              <Play className="h-8 w-8 fill-current" />
            )}
          </motion.button>

          <button
            onClick={() => state.next()}
            className="transition hover:scale-110 active:scale-95"
            aria-label="Next"
          >
            <SkipForward className="h-8 w-8 fill-current" />
          </button>

          <button
            onClick={() => state.cycleRepeat()}
            className={`transition ${state.repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Repeat"
          >
            {state.repeat === "one" ? (
              <Repeat1 className="h-5 w-5" />
            ) : (
              <Repeat className="h-5 w-5" />
            )}
          </button>
        </motion.div>

        {/* Controls - Secondary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4"
        >
          <LikeButton track={track} size="lg" />
          <SpeedControl />
          {isOnline && !isCached && track.streamUrl && (
            <motion.button
              onClick={() => cacheTrack(track)}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
              aria-label="Download for offline"
            >
              <Download className="h-4 w-4" />
              Save offline
            </motion.button>
          )}
          {isCached && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-600"
            >
              ✓ Offline ready
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-6 pb-8 text-center text-xs text-muted-foreground/60"
      >
        Space to play/pause • ← → to skip • D to save for offline
      </motion.div>
    </motion.div>
  );
}

function SpeedControl() {
  const rate = usePlayer((s) => s.playbackRate);
  const setRate = usePlayer((s) => s.setPlaybackRate);
  const steps = [0.75, 1, 1.25, 1.5, 2];
  const next = () => {
    const i = steps.indexOf(rate);
    setRate(steps[(i + 1) % steps.length] ?? 1);
  };
  return (
    <button
      onClick={next}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-1/60 px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
      aria-label="Playback speed"
    >
      <Gauge className="h-3.5 w-3.5" />
      {rate}×
    </button>
  );
}
