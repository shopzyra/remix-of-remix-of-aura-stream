import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";

export const Route = createFileRoute("/legal/cookies")({
  component: () => (
    <>
      <h1>Cookie Policy</h1>
      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <p>
        {config.app.name} uses a minimal amount of browser storage to keep you signed in and
        remember your preferences. We do not use advertising or tracking cookies.
      </p>

      <h2>What we store</h2>
      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
        <li><strong>Authentication</strong>: your Supabase session token (httpOnly when possible).</li>
        <li><strong>Preferences</strong>: theme, volume, queue state, playback position — stored in <code>localStorage</code>.</li>
        <li><strong>Cache</strong>: track artwork and metadata for instant repeat plays.</li>
      </ul>

      <h2>Third-party</h2>
      <p>
        Streams from Audius are requested directly from public discovery nodes. Those nodes
        may log basic request data (IP, user-agent) per their own policies.
      </p>

      <h2>Your control</h2>
      <p>
        You can clear all {config.app.name} data at any time by signing out and clearing site
        data in your browser. Disabling cookies or local storage will sign you out and reset
        your queue.
      </p>
    </>
  ),
});
