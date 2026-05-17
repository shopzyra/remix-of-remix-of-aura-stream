import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";

export const Route = createFileRoute("/legal/community")({
  component: () => (
    <>
      <h1>Community Guidelines</h1>
      <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>

      <p>
        {config.app.name} is for people who love music. To keep it that way, we ask everyone
        to follow these simple rules.
      </p>

      <h2>Be respectful</h2>
      <p>
        No harassment, hate speech, threats, doxxing, or coordinated abuse. Disagreement is
        fine; cruelty is not.
      </p>

      <h2>Respect copyrights</h2>
      <p>
        Only upload music you own or have permission to use. Don't share other people's
        private uploads.
      </p>

      <h2>No spam, scams or impersonation</h2>
      <p>
        Don't pretend to be someone you're not, and don't use playlists or profiles to
        promote scams or unrelated commercial content.
      </p>

      <h2>Report problems</h2>
      <p>
        See something off? Email
        {" "}<a href={`mailto:${config.legal.supportEmail}`}>{config.legal.supportEmail}</a>.
        We review every report.
      </p>

      <h2>Consequences</h2>
      <p>
        Violations may result in content removal, temporary suspension, or permanent
        account closure depending on severity.
      </p>
    </>
  ),
});
