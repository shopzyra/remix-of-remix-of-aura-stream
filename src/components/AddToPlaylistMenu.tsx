import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ListMusic, Check, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayer, type Track } from "@/store/player";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TrackMenu({ track, className }: { track: Track; className?: string }) {
  const { user } = useUser();
  const { enqueue, playNext } = usePlayer();
  const [dialogOpen, setDialogOpen] = useState(false);

  const playlists = useQuery({
    queryKey: ["playlists", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("owner_id", user!.id)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async (playlistId: string) => {
      if (track.source === "preview") {
        throw new Error("30s previews can't be saved to playlists. Try the Like button instead.");
      }
      const { data: rows } = await supabase
        .from("playlist_tracks")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);
      const position = (rows?.[0]?.position ?? -1) + 1;
      const { error } = await supabase.from("playlist_tracks").insert({
        playlist_id: playlistId,
        position,
        source: track.source,
        external_id: track.source === "audius" ? track.id : null,
        uploaded_track_id: track.source === "uploaded" ? track.id : null,
        title: track.title,
        artist: track.artist ?? null,
        cover_url: track.coverUrl ?? null,
        stream_url: track.streamUrl ?? null,
        duration_seconds: track.durationSeconds ?? null,
        added_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, playlistId) => {
      toast.success("Added to playlist");
      qc.invalidateQueries({ queryKey: ["playlist", playlistId, "tracks"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`rounded p-1.5 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground ${className ?? ""}`}
            aria-label="Track options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 border-border bg-popover"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem onClick={() => playNext(track)}>Play next</DropdownMenuItem>
          <DropdownMenuItem onClick={() => enqueue(track)}>Add to queue</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Add to playlist
          </DropdownMenuLabel>
          {!user ? (
            <DropdownMenuItem disabled>Sign in to save</DropdownMenuItem>
          ) : (playlists.data ?? []).length === 0 ? (
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="mr-2 h-4 w-4" /> Create your first playlist
              </DropdownMenuItem>
            </DialogTrigger>
          ) : (
            <>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="mr-2 h-4 w-4" /> New playlist…
                </DropdownMenuItem>
              </DialogTrigger>
              {(playlists.data ?? []).map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => add.mutate(p.id)}
                  className="cursor-pointer"
                >
                  <ListMusic className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <NewPlaylistDialogContent
        onCreated={(id) => {
          setDialogOpen(false);
          add.mutate(id);
        }}
      />
    </Dialog>
  );
}

function NewPlaylistDialogContent({ onCreated }: { onCreated: (id: string) => void }) {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent className="border-border bg-popover">
      <DialogHeader>
        <DialogTitle>New playlist</DialogTitle>
      </DialogHeader>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Playlist name"
        className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        disabled={!name.trim() || busy || !user}
        onClick={async () => {
          if (!user) return;
          setBusy(true);
          const { data, error } = await supabase
            .from("playlists")
            .insert({ owner_id: user.id, name: name.trim() })
            .select("id")
            .single();
          setBusy(false);
          if (error || !data) return toast.error(error?.message ?? "Failed");
          onCreated(data.id);
        }}
        className="rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        <Check className="mr-1 inline h-4 w-4" /> Create & add
      </button>
    </DialogContent>
  );
}
