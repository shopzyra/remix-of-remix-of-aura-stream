import { useQuery } from "@tanstack/react-query";
import { Info, TrendingUp, Music, Calendar, Clock, User2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Track } from "@/store/player";
import { getTrack } from "@/lib/audius";
import { formatDuration } from "@/lib/format";

export function TrackDetailsDialog({ track, trigger }: { track: Track; trigger?: React.ReactNode }) {
  const details = useQuery({
    queryKey: ["track-details", track.source, track.id],
    enabled: track.source === "audius",
    queryFn: () => getTrack(track.id),
    staleTime: 5 * 60_000,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            className="rounded-full p-2 text-muted-foreground hover:bg-surface-1 hover:text-foreground"
            aria-label="Track details"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="border-border bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="truncate">{track.title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-2">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full gradient-brand" />
            )}
          </div>
          <dl className="grid flex-1 gap-2 text-sm">
            <Row icon={<User2 className="h-3.5 w-3.5" />} label="Artist" value={track.artist || "Unknown"} />
            <Row icon={<Clock className="h-3.5 w-3.5" />} label="Length" value={formatDuration(track.durationSeconds)} />
            <Row
              icon={<Music className="h-3.5 w-3.5" />}
              label="Source"
              value={
                track.source === "audius"
                  ? "Audius (full track)"
                  : track.source === "preview"
                    ? "iTunes (30s preview)"
                    : "Uploaded"
              }
            />
            {details.data?.genre && (
              <Row icon={<Music className="h-3.5 w-3.5" />} label="Genre" value={details.data.genre} />
            )}
            {typeof details.data?.play_count === "number" && (
              <Row
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Plays"
                value={details.data.play_count.toLocaleString()}
              />
            )}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="truncate text-right">{value}</span>
    </div>
  );
}
