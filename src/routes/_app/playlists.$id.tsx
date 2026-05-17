import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play, Trash2, GripVertical, ListMusic, Pencil, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { usePlayer, type Track } from "@/store/player";
import { formatDuration } from "@/lib/format";

export const Route = createFileRoute("/_app/playlists/$id")({
  component: PlaylistDetail,
});

function PlaylistDetail() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const meta = useQuery({
    queryKey: ["playlist", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("playlists").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const items = useQuery({
    queryKey: ["playlist", id, "tracks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("playlist_tracks")
        .select("*")
        .eq("playlist_id", id)
        .order("position");
      return data ?? [];
    },
  });

  const tracks: Track[] = (items.data ?? []).map((r) => ({
    key: `${r.source}:${r.source === "uploaded" ? r.uploaded_track_id : r.external_id}`,
    source: r.source as "audius" | "uploaded",
    id: (r.source === "uploaded" ? r.uploaded_track_id : r.external_id) || "",
    title: r.title,
    artist: r.artist ?? undefined,
    coverUrl: r.cover_url ?? undefined,
    durationSeconds: r.duration_seconds ?? undefined,
    streamUrl: r.stream_url ?? undefined,
  }));
  const { playNow } = usePlayer();

  const isOwner = !!user && meta.data?.owner_id === user.id;

  const remove = useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from("playlist_tracks").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlist", id, "tracks"] }),
  });

  const rename = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("playlists").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["playlist", id] });
    },
  });

  const togglePublic = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("playlists")
        .update({ is_public: !meta.data!.is_public })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["playlist", id] }),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("playlists").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Playlist deleted");
      navigate({ to: "/playlists" });
    },
  });

  if (meta.isLoading) return <div className="h-32 animate-pulse rounded-2xl bg-surface-2" />;
  if (!meta.data) return <p>Not found.</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="grid h-48 w-48 shrink-0 place-items-center overflow-hidden rounded-2xl gradient-brand shadow-glow">
          {meta.data.cover_url ? (
            <img src={meta.data.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ListMusic className="h-16 w-16 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Playlist</div>
          {editing ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-border bg-surface-1 px-2 py-1 text-3xl font-extrabold"
              />
              <button onClick={() => rename.mutate()} className="rounded p-2 hover:bg-surface-1">
                <Check className="h-5 w-5 text-primary" />
              </button>
            </div>
          ) : (
            <h1 className="mt-1 flex items-center gap-2 text-4xl font-extrabold tracking-tight">
              {meta.data.name}
              {isOwner && (
                <button
                  onClick={() => {
                    setName(meta.data!.name);
                    setEditing(true);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-surface-1"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{tracks.length} tracks</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => tracks.length > 0 && playNow(tracks, 0)}
              disabled={tracks.length === 0}
              className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              <Play className="h-4 w-4 fill-current" /> Play
            </button>
            {isOwner && (
              <>
                <button onClick={() => togglePublic.mutate()} className="rounded-full border border-border px-4 py-2 text-sm">
                  {meta.data.is_public ? "Make private" : "Make public"}
                </button>
                <button
                  onClick={() => confirm("Delete this playlist?") && del.mutate()}
                  className="rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-1">
        {tracks.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            This playlist is empty. Use “Add to playlist” from any track.
          </p>
        ) : (
          tracks.map((t, i) => (
            <div key={t.key + i} className="group flex items-center gap-3 rounded-lg p-2 hover:bg-surface-1">
              <span className="w-6 text-center text-xs text-muted-foreground tabular-nums">{i + 1}</span>
              <button onClick={() => playNow(tracks, i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
                  {t.coverUrl ? (
                    <img src={t.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full gradient-brand" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
                </div>
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(t.durationSeconds)}</span>
              {isOwner && (
                <button
                  onClick={() => remove.mutate(items.data![i].id)}
                  className="rounded p-1 opacity-0 transition hover:bg-surface-2 group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
