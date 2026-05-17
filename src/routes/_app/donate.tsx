import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Coffee, Heart, Server, Shield, Sparkles } from "lucide-react";
import { config } from "@/lib/config";

export const Route = createFileRoute("/_app/donate")({
  component: DonatePage,
});

function DonatePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-glow">
          <Heart className="h-6 w-6 fill-current text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Keep <span className="text-gradient">{config.app.name}</span> ad‑free
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          We don't run ads, sell data or push trackers. We're 100% supported by listeners like you.
        </p>
      </motion.header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { i: <Server className="h-5 w-5" />, t: "Servers & bandwidth", d: "Streaming millions of tracks isn't free." },
          { i: <Shield className="h-5 w-5" />, t: "Privacy first", d: "No ads, no third-party tracking." },
          { i: <Sparkles className="h-5 w-5" />, t: "New features", d: "Lyrics, downloads, social — built in the open." },
        ].map((b, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg gradient-brand text-primary-foreground">
              {b.i}
            </div>
            <h3 className="font-semibold">{b.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.d}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-8 text-center">
        {config.donation.link ? (
          <a
            href={config.donation.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-3 text-base font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            <Coffee className="h-4 w-4" /> {config.donation.label}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            Donation link not configured. Set <code className="font-mono">VITE_DONATION_LINK</code> in your environment.
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          One-time or recurring. Every cup of coffee counts ☕
        </p>
      </div>
    </div>
  );
}
