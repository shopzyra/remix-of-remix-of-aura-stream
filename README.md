# Auralis — Premium Music Streaming

A modern, fast, and beautiful music streaming platform built with React, TanStack Start, and Supabase. Designed with a Spotify-inspired dark aesthetic featuring a violet brand accent, Auralis delivers a premium listening experience across web and mobile.

## Features

- **Audio Playback**: HTML5 audio engine with crossfade, gapless playback, MediaSession API (lock-screen controls), and audio device switching
- **Music Sources**: Audius decentralized catalog + user uploads via Supabase Storage
- **Player**: Global persistent player with queue management, shuffle, repeat modes, and mini/full player views
- **Search**: Instant search across Audius tracks with trending and underground discovery
- **Playlists**: Create, edit, and manage personal playlists with add-to-playlist functionality
- **Library**: Liked songs, listening history, and recently played
- **Lyrics**: Synced lyrics lookup via lrclib.net
- **Auth**: Email/password, Google OAuth, GitHub OAuth, Microsoft OAuth (all toggleable via env)
- **PWA**: Installable progressive web app with offline-ready assets
- **Donations**: Built-in donation/support page for ad-free sustainability
- **Legal**: Comprehensive Terms, Privacy, Cookies, DMCA, and Community Guidelines pages
- **Responsive**: Mobile-first design with bottom navigation and desktop sidebar

## Tech Stack

- **Framework**: TanStack Start v1 (React 19 + Vite 7)
- **Styling**: Tailwind CSS v4 with custom OKLCH design tokens
- **State**: Zustand (player) + TanStack Query (server state)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Animations**: Framer Motion
- **UI**: Radix UI primitives + shadcn components
- **Audio**: HTML5 Audio API with dual-element crossfade

## Quick Start

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd auralis
   bun install
   ```

2. **Environment variables**
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. **Supabase setup**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the migrations in `supabase/migrations/`
   - Enable Auth providers (Email, Google, GitHub, Microsoft) in Auth settings
   - Create a storage bucket named `audio-uploads` with public read policies
   - Set the Site URL and redirect URLs in Auth settings

4. **Run locally**
   ```bash
   bun dev
   ```

5. **Build for production**
   ```bash
   bun build
   ```

## Configuration

All features are configurable via environment variables. See `.env.example` for the full list.

Key toggles:
- `VITE_AUTH_EMAIL` / `VITE_AUTH_GOOGLE` / `VITE_AUTH_GITHUB` / `VITE_AUTH_MICROSOFT` — Enable auth providers
- `VITE_ENABLE_CROSSFADE` — Toggle crossfade between tracks
- `VITE_ENABLE_LYRICS` — Toggle lyrics feature
- `VITE_ENABLE_UPLOADS` — Toggle user uploads
- `VITE_ENABLE_DOWNLOADS` — Toggle offline downloads
- `VITE_DONATION_LINK` — Your donation/support URL

## Deployment

### Vercel
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables from `.env`
4. Deploy

See `docs/DEPLOYMENT.md` for detailed instructions.

## Project Structure

```
src/
  components/       # Reusable UI components
  routes/          # TanStack file-based routes
  store/           # Zustand stores (player state)
  lib/             # Utilities, API clients, config
  hooks/           # Custom React hooks
  integrations/    # Supabase clients and middleware
public/            # Static assets, PWA manifest
supabase/
  migrations/      # Database schema migrations
```

## License

MIT — see `docs/LICENSE.md` (create if needed).

---

Built with love and zero ads. Support the project via the in-app donation page.
