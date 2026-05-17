import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Library,
  Upload,
  Settings,
  Heart,
  ListMusic,
  Plus,
  Coffee,
  Mic2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { MiniPlayer } from "@/components/MiniPlayer";
import { config } from "@/lib/config";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MiniPlayer />
      <MobileNav />
    </div>
  );
}

function Sidebar() {
  const { user } = useUser();
  const loc = useLocation();
  const nav = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/library", icon: Library, label: "Library" },
    { to: "/playlists", icon: ListMusic, label: "Playlists" },
    { to: "/liked", icon: Heart, label: "Liked" },
    { to: "/lyrics", icon: Mic2, label: "Lyrics" },
  ] as const;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
      <Link to="/home" className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand shadow-glow">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="currentColor">
            <path d="M4 12c0-4 3-7 8-7s8 3 8 7-3 7-8 7c-1.5 0-2.8-.3-4-.8V21l-4-2v-7Z" />
          </svg>
        </div>
        <span className="text-lg font-bold">{config.app.logoText}</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map(({ to, icon: Icon, label }) => {
          const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-sidebar-border pt-4">
        {config.features.uploads && (
          <Link
            to="/upload"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
        )}
        <Link
          to="/playlists"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Plus className="h-4 w-4" />
          New playlist
        </Link>
      </div>

      <div className="mt-auto space-y-3 pt-4">
        <Link
          to="/donate"
          className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          <Coffee className="h-4 w-4" />
          {config.donation.label || "Support us"}
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        {user && (
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-card/30 p-2 text-xs"
          >
            <div className="grid h-7 w-7 place-items-center rounded-full gradient-brand text-[10px] font-bold text-primary-foreground">
              {(user.email?.[0] ?? "?").toUpperCase()}
            </div>
            <span className="truncate">{user.email}</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

function MobileNav() {
  const loc = useLocation();
  const items = [
    { to: "/home", icon: Home, label: "Home" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/library", icon: Library, label: "Library" },
    { to: "/settings", icon: Settings, label: "You" },
  ] as const;
  return (
    <motion.nav
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(({ to, icon: Icon, label }) => {
        const active = loc.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 py-2 text-[10px] ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </motion.nav>
  );
}
