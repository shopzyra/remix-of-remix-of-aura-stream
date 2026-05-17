# Deployment Guide

## Deploy to Vercel (Recommended)

### Option A: GitHub Import

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. In **Environment Variables**, add all variables from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - All `VITE_*` feature toggles

5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to link your project. Add environment variables in the Vercel dashboard after deployment.

## Post-Deployment Checklist

### Update Supabase Auth Redirects

After getting your production URL (e.g., `https://auralis.vercel.app`):

1. Go to Supabase → Authentication → URL Configuration
2. Add your production redirect URL:
   ```
   https://auralis.vercel.app/auth/callback
   ```
3. Update the **Site URL** to your production domain

### Update Environment Variables

Ensure these are set in Vercel:

```
VITE_APP_URL=https://auralis.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Configure PWA

The app is already PWA-ready with:
- `public/manifest.webmanifest`
- Service worker (handled by browser for static assets)
- Icons in `public/icon-192.png` and `public/icon-512.png`

Users can install the app via Chrome → "Install Auralis" prompt.

## Custom Domain (Optional)

1. In Vercel Dashboard → Domains
2. Add your custom domain
3. Update `VITE_APP_URL` and Supabase redirect URLs

## Troubleshooting Production Issues

### 404 on page refresh
- Already handled by `vercel.json` SPA rewrites
- If using another host, ensure all routes fallback to `index.html`

### OAuth not working
- Double-check redirect URLs in Supabase match your exact production domain
- Ensure `https://` is used (not `http://`)

### Audio not loading
- Supabase Storage signed URLs expire; ensure `audio-uploads` bucket policies allow authenticated reads
- Check browser DevTools Network tab for CORS errors

### Slow track loading
- Audius discovery nodes can be slow; the app uses a fallback strategy
- Consider implementing a CDN or caching layer for uploaded tracks
