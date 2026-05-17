import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase reads the auth hash/code from the URL on init; just give it a tick.
    let cancelled = false;
    const settle = async () => {
      // If the URL has a `?code=` (PKCE) Supabase will exchange it on getSession().
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {});
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      navigate({ to: data.session ? "/home" : "/auth", replace: true });
    };
    settle();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
