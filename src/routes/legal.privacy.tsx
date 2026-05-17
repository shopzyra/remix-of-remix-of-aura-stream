import { createFileRoute } from "@tanstack/react-router";
import { config } from "@/lib/config";
export const Route = createFileRoute("/legal/privacy")({ component: () => (
  <>
    <h1>Privacy Policy</h1>
    <p>We collect the minimum needed to run the service: email, profile data you provide, listening history, likes, playlists, and uploaded audio.</p>
    <h2>How we use data</h2>
    <p>To personalize your library, sync across devices, and operate the service. We do not sell your data.</p>
    <h2>Third parties</h2>
    <p>Authentication and storage are powered by Supabase. Music discovery uses the Audius open API.</p>
    <h2>Your rights</h2>
    <p>Email {config.legal.companyEmail} to access or delete your data.</p>
  </>
)});
