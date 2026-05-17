# Setup Guide

This guide walks you through setting up Auralis from scratch after remixing or cloning the project.

## Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works)
- (Optional) A Vercel account for deployment

## Step 1: Install Dependencies

```bash
bun install
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:

   | Variable | Where to find it |
   |----------|------------------|
   | `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API → `anon` public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` secret key |

3. Adjust feature toggles as desired:
   ```bash
   VITE_AUTH_GOOGLE=true
   VITE_AUTH_GITHUB=false
   VITE_AUTH_MICROSOFT=false
   VITE_ENABLE_LYRICS=true
   VITE_ENABLE_UPLOADS=true
   VITE_DONATION_LINK=https://ko-fi.com/yourname
   ```

## Step 3: Set Up Supabase Database

### Run Migrations

In your Supabase project, open the SQL Editor and run the migration files in order:

1. `supabase/migrations/20260517153212_6a07368a-b8ea-4cac-ba36-58a72bef0f92.sql` (schema + RLS)
2. `supabase/migrations/20260517153647_a9a905f8-f3ca-4224-bd7e-2ab8bef60dc6.sql` (audius cache)

### Configure Auth

1. Go to **Authentication → Providers**
2. Enable the providers you set in `.env`:
   - **Email**: Enabled by default
   - **Google**: Add your Google OAuth credentials
   - **GitHub**: Add your GitHub OAuth App credentials
   - **Microsoft**: Add your Azure AD credentials

3. Go to **Authentication → URL Configuration**
   - Set **Site URL** to your production domain (e.g., `https://auralis.vercel.app`)
   - Add redirect URLs:
     - `http://localhost:5173/auth/callback`
     - `https://your-domain.com/auth/callback`

### Configure Storage

1. Go to **Storage → New bucket**
   - Name: `audio-uploads`
   - Public: **Off** (we use signed URLs)

2. Add these policies:
   - **Upload**: `authenticated` users can upload to `audio-uploads`
   - **Read**: `authenticated` users can read from `audio-uploads`
   - **Delete**: Users can only delete their own uploads

## Step 4: Run Locally

```bash
bun dev
```

Open `http://localhost:5173` in your browser.

## Step 5: Test Everything

1. **Auth**: Sign up with email or OAuth
2. **Upload**: Go to `/upload` and upload an MP3/M4A file
3. **Search**: Search for tracks via Audius
4. **Playlists**: Create a playlist and add tracks
5. **Player**: Test play, pause, queue, shuffle, repeat
6. **PWA**: In Chrome DevTools → Application → Install as PWA

## Troubleshooting

### "Missing Supabase environment variable" error
- Double-check `.env` has all required variables
- Restart the dev server after editing `.env`

### Audio won't play
- Check browser console for CORS errors
- Ensure signed URLs are being generated for uploaded tracks
- Try a different audio format (MP3 is most compatible)

### OAuth redirect fails
- Verify redirect URLs in Supabase Auth settings match your actual domain
- Ensure the `/auth/callback` route exists in your deployed app

### Build fails
- Run `bun install` again to ensure all dependencies are present
- Check that no imports are unresolved (TanStack Start is strict about this)

## Next Steps

- See `docs/DEPLOYMENT.md` for production deployment
- Customize branding in `.env` (app name, colors, SEO metadata)
- Adjust feature toggles to match your use case
