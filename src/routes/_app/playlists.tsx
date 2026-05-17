import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";

export const Route = createFileRoute("/_app/playlists")({
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const list = useQuery({
    queryKey: ["playlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !name.trim()) return;
      const { error } = await supabase
        .from("playlists")
        .insert({ owner_id: user.id, name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      toast.success("Playlist created");
      qc.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Playlists</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and curate your own collections.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="glass flex items-center gap-2 rounded-xl p-1.5 pl-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New playlist name"
            className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!name.trim() || create.isPending}
            className="inline-flex items-center gap-1 rounded-lg gradient-brand px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Create
          </button>
        </form>
      </div>

      {(list.data ?? []).length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border p-12 text-center">
          <ListMusic className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven't made any playlists yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(list.data ?? []).map((p) => (
            <Link key={p.id} to="/playlists/$id" params={{ id: p.id }} className="group">
              <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-surface-2">
                {p.cover_url ? (
                  <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center gradient-brand">
                    <ListMusic className="h-10 w-10 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="truncate text-sm font-semibold">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {p.is_public ? "Public" : "Private"} {p.is_collaborative ? "· Collab" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
