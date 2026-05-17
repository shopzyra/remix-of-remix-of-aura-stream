import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/legal/cookies")({ component: () => (
  <>
    <h1>Cookie Policy</h1>
    <p>We use only essential cookies and local storage to keep you signed in and remember playback state. We do not use advertising or tracking cookies.</p>
  </>
)});
