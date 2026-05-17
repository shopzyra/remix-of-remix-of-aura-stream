import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal")({ component: LegalLayout });

function LegalLayout() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <article className="prose prose-invert max-w-none [&_h1]:text-3xl [&_h1]:font-extrabold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_p]:mt-3 [&_p]:text-muted-foreground">
        <Outlet />
      </article>
      <nav className="mt-12 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
        <Link to="/legal/terms">Terms</Link>
        <Link to="/legal/privacy">Privacy</Link>
        <Link to="/legal/cookies">Cookies</Link>
        <Link to="/legal/dmca">DMCA</Link>
        <Link to="/legal/community">Community</Link>
      </nav>
    </div>
  );
}
