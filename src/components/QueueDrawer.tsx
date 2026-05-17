import { motion } from "framer-motion";
import { X, GripVertical, Trash2, Play } from "lucide-react";
import { usePlayer } from "@/store/player";
import { formatDuration } from "@/lib/format";

export function QueueDrawer({ onClose }: { onClose: () => void }) {
  const { queue, index, jumpTo, removeAt, clearQueue } = usePlayer();
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 240, damping: 28 }}
      className="glass fixed right-2 top-2 z-50 flex h-[calc(100vh-6rem)] w-[360px] max-w-[92vw] flex-col rounded-2xl"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Queue ({queue.length})</h3>
        <div className="flex items-center gap-1">
          <button onClick={clearQueue} className="rounded p-1.5 text-muted-foreground hover:bg-surface-1" aria-label="Clear">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-surface-1" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {queue.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Queue is empty</div>
        ) : (
          queue.map((t, i) => (
            <div
              key={`${t.key}-${i}`}
              className={`group flex items-center gap-2 rounded-lg p-2 ${i === index ? "bg-primary/10" : "hover:bg-surface-1"}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-50" />
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded">
                {t.coverUrl ? (
                  <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-brand" />
                )}
              </div>
              <button onClick={() => jumpTo(i)} className="min-w-0 flex-1 text-left">
                <div className={`truncate text-sm ${i === index ? "text-primary font-medium" : ""}`}>{t.title}</div>
                <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums">{formatDuration(t.durationSeconds)}</span>
              <button
                onClick={() => removeAt(i)}
                className="rounded p-1 opacity-0 transition hover:bg-surface-2 group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
