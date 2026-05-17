import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Play, Headphones, Sparkles, Heart } from "lucide-react";
import { config } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/home" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/30 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-glow/20 blur-[140px]" />
      </div>

      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold">{config.app.logoText}</span>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/auth"
            className="rounded-full px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full gradient-brand px-4 py-2 font-semibold text-primary-foreground shadow-glow"
          >
            Start free
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 text-center sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground"
        >
          <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
          Next-generation music streaming
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 max-w-3xl text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl"
        >
          Your sound,
          <br />
          <span className="text-gradient">in perfect motion.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Stream millions of tracks from the open Audius network, upload your own
          library, build playlists and listen anywhere — instantly.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="group inline-flex items-center gap-2 rounded-full gradient-brand px-7 py-3 text-base font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            <Play className="h-4 w-4 fill-current" />
            Get started — it's free
          </Link>
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 text-base hover:bg-surface-1"
          >
            Explore the app
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-20 grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { i: <Headphones />, t: "Instant playback", d: "Adaptive streaming with crossfade and gapless playback." },
            { i: <Heart />, t: "Built for taste", d: "Likes, playlists, history — your library, your rules." },
            { i: <Sparkles />, t: "No ads, ever", d: "Donation-supported. No interruptions, no tracking." },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 text-left">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
                {f.i}
              </div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="mx-auto mt-24 max-w-6xl px-6 pb-8 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <span>© {new Date().getFullYear()} {config.legal.companyName}</span>
          <div className="flex gap-4">
            <Link to="/legal/terms">Terms</Link>
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/cookies">Cookies</Link>
            <Link to="/legal/dmca">DMCA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand shadow-glow">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="currentColor">
        <path d="M4 12c0-4 3-7 8-7s8 3 8 7-3 7-8 7c-1.5 0-2.8-.3-4-.8V21l-4-2v-7Z" />
      </svg>
    </div>
  );
}
