import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Track } from "@/store/player";

export function LikeButton({
  track,
  className,
  size = "md",
}: {
  track: Track;
  className?: string;
  size?: "md" | "lg";
}) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("liked_tracks")
      .select("user_id")
      .eq("source", track.source)
      .eq("track_key", track.id)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) {
          setLiked(!!data);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [track.key]);

  const toggle = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      toast.error("Sign in to like tracks");
      return;
    }
    if (liked) {
      await supabase
        .from("liked_tracks")
        .delete()
        .eq("user_id", u.user.id)
        .eq("source", track.source)
        .eq("track_key", track.id);
      setLiked(false);
    } else {
      await supabase.from("liked_tracks").insert({
        user_id: u.user.id,
        source: track.source,
        track_key: track.id,
        title: track.title,
        artist: track.artist ?? null,
        cover_url: track.coverUrl ?? null,
        duration_seconds: track.durationSeconds ?? null,
        stream_url: track.streamUrl ?? null,
      });
      setLiked(true);
    }
  };

  const icon = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label="Like"
      className={`transition ${liked ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${className ?? ""}`}
    >
      <Heart className={`${icon} ${liked ? "fill-current" : ""}`} />
    </button>
  );
}
