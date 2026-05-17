import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { usePlayer, type Track } from "@/store/player";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useUser();
  const { playNow } = usePlayer();

  const hist = useQuery({
    queryKey: ["history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("listening_history")
        .select("*")
        .order("played_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold tracking-tight">Listening history</h1>
      <div className="space-y-1">
        {(hist.data ?? []).map((h) => {
          const t: Track = {
            key: `${h.source}:${h.track_key}`,
            source: h.source as "audius" | "uploaded",
            id: h.track_key,
            title: h.title,
            artist: h.artist ?? undefined,
            coverUrl: h.cover_url ?? undefined,
          };
          return (
            <button
              key={h.id}
              onClick={() => playNow(t)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-surface-1"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded">
                {h.cover_url ? (
                  <img src={h.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full gradient-brand" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{h.title}</div>
                <div className="truncate text-xs text-muted-foreground">{h.artist}</div>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(h.played_at)}</span>
            </button>
          );
        })}
        {(hist.data ?? []).length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">Nothing played yet.</p>
        )}
      </div>
    </div>
  );
}
