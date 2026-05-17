import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Coffee, Github, Mail, HardDrive, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { config } from "@/lib/config";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { cacheSize, cachedTracks, clearOfflineCache, getCacheSize } = useServiceWorker();
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

  useEffect(() => {
    getCacheSize();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

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

  const handleClearCache = () => {
    if (confirm("Clear all offline downloads? This cannot be undone.")) {
      clearOfflineCache();
      toast.success("Offline storage cleared");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass space-y-4 rounded-2xl p-6"
      >
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
          className="rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:shadow-lg active:scale-95"
        >
          Save
        </button>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass space-y-3 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold">Appearance</h2>
        <div className="flex gap-2">
          {(["dark", "amoled"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`rounded-lg px-4 py-2 text-sm capitalize transition ${
                theme === t ? "gradient-brand text-primary-foreground" : "border border-border hover:border-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Offline Storage Section */}
      {cachedTracks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-emerald-600">Offline storage</h2>
              </div>
              <p className="text-sm text-emerald-600/70">
                {cachedTracks.length} track{cachedTracks.length !== 1 ? "s" : ""} ready to play offline
              </p>
              <p className="text-xs text-emerald-600/60">
                Storage used: {formatBytes(cacheSize)}
              </p>
              <motion.button
                onClick={handleClearCache}
                whileHover={{ scale: 1.02 }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/30 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                Clear storage
              </motion.button>
            </div>
          </div>
        </motion.section>
      )}

      {config.donation.provider && config.donation.link && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass space-y-3 rounded-2xl p-6"
        >
          <h2 className="text-lg font-bold">Support Auralis</h2>
          <p className="text-sm text-muted-foreground">
            We run ad-free. Your tip keeps the lights on.
          </p>
          <a
            href={config.donation.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 active:scale-95"
          >
            <Coffee className="h-4 w-4" /> {config.donation.label}
          </a>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass space-y-2 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold">About</h2>
        <p className="text-sm text-muted-foreground">
          Need help? <a href={`mailto:${config.legal.supportEmail}`} className="text-primary hover:underline">
            <Mail className="mr-1 inline h-3 w-3" />{config.legal.supportEmail}
          </a>
        </p>
      </motion.section>

      <motion.button
        onClick={logout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm text-destructive transition hover:bg-destructive/10 active:scale-95"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </motion.button>
    </div>
  );
}
