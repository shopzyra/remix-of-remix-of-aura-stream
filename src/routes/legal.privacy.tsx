import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";

export const Route = createFileRoute("/legal/privacy")({
  component: () => (
    <>
      <h1>Privacy Policy</h1>
      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <p>
        This policy describes how {config.legal.companyName} ("we") collects, uses and
        protects your information when you use {config.app.name}.
      </p>

      <h2>1. What we collect</h2>
      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
        <li><strong>Account</strong>: email, hashed password or OAuth identifier, display name.</li>
        <li><strong>Library</strong>: playlists you create, tracks you like, listening history.</li>
        <li><strong>Uploads</strong>: audio files you upload and basic metadata (title, duration).</li>
        <li><strong>Technical</strong>: device, browser, language, IP address (for security and abuse prevention).</li>
      </ul>

      <h2>2. What we do NOT collect</h2>
      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
        <li>We do not run ad networks or third-party trackers.</li>
        <li>We do not sell or rent your personal data, ever.</li>
        <li>We do not build advertising profiles.</li>
      </ul>

      <h2>3. How we use your data</h2>
      <p>
        To run and improve the service: authenticate you, sync your library across devices,
        recommend music, and prevent abuse. Some data (e.g. playlist artwork on a public
        playlist) becomes visible to other users only when you explicitly make it public.
      </p>

      <h2>4. Third parties</h2>
      <p>
        We use the following processors strictly to provide the service:
      </p>
      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
        <li><strong>Supabase</strong> — authentication, database, file storage.</li>
        <li><strong>Audius</strong> — public music catalog; stream requests are made directly from your browser.</li>
        <li><strong>lrclib.net</strong> — open lyrics database; requests are anonymous.</li>
        <li>Your chosen hosting provider (e.g. Vercel, Cloudflare).</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>
        You can access, export, correct or delete your personal data at any time from
        Settings, or by emailing
        {" "}<a href={`mailto:${config.legal.supportEmail}`}>{config.legal.supportEmail}</a>.
        EU/UK residents have the rights granted by the GDPR; California residents have the
        rights granted by the CCPA. We will respond within 30 days.
      </p>

      <h2>6. Children</h2>
      <p>
        {config.app.name} is not intended for children under 13. If you believe a child has
        provided us with personal information, contact us and we will delete it.
      </p>

      <h2>7. Security</h2>
      <p>
        Data is encrypted in transit (TLS) and at rest. Row-level security in our database
        ensures users cannot access each other's private data. No system is perfectly
        secure — please use a strong, unique password.
      </p>

      <h2>8. Contact</h2>
      <p>
        Privacy questions:
        {" "}<a href={`mailto:${config.legal.companyEmail}`}>{config.legal.companyEmail}</a>
      </p>
    </>
  ),
});
