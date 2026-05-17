import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Coffee, Github, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { config } from "@/lib/config";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState<"dark" | "amoled">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("amoled")
      ? "amoled"
      : "dark"
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setUsername(data.username ?? "");
        }
      });
  }, [user]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("amoled", theme === "amoled");
    localStorage.setItem("auralis-theme", theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem("auralis-theme") as "dark" | "amoled" | null;
    if (saved) setTheme(saved);
  }, []);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, username: username || null })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <section className="glass space-y-3 rounded-2xl p-6">
        <h2 className="text-lg font-bold">Profile</h2>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="unique handle"
            className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={save}
          className="rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Save
        </button>
      </section>

      <section className="glass space-y-3 rounded-2xl p-6">
        <h2 className="text-lg font-bold">Appearance</h2>
        <div className="flex gap-2">
          {(["dark", "amoled"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`rounded-lg px-4 py-2 text-sm capitalize ${
                theme === t ? "gradient-brand text-primary-foreground" : "border border-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {config.donation.provider && config.donation.link && (
        <section className="glass space-y-3 rounded-2xl p-6">
          <h2 className="text-lg font-bold">Support Auralis</h2>
          <p className="text-sm text-muted-foreground">
            We run ad-free. Your tip keeps the lights on.
          </p>
          <a
            href={config.donation.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <Coffee className="h-4 w-4" /> {config.donation.label}
          </a>
        </section>
      )}

      <section className="glass space-y-2 rounded-2xl p-6">
        <h2 className="text-lg font-bold">About</h2>
        <p className="text-sm text-muted-foreground">
          Need help? <a href={`mailto:${config.legal.supportEmail}`} className="text-primary hover:underline">
            <Mail className="mr-1 inline h-3 w-3" />{config.legal.supportEmail}
          </a>
        </p>
      </section>

      <button
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}
