# API & Integration Guide

## Audius Integration

Auralis uses the Audius decentralized music network as its primary catalog source.

### How it works

- **Discovery**: The `src/lib/audius.ts` client queries Audius discovery nodes
- **Trending**: Two endpoints — mainstream trending and underground gems
- **Search**: Full-text search across tracks, users, and playlists
- **Streaming**: Direct stream URLs from Audius content nodes

### Rate Limits

Audius public APIs are free but rate-limited. For production scale:
- Cache popular queries in Supabase (table: `audius_cache`)
- Implement client-side request deduplication

### Custom Discovery Node

Set a preferred node in `.env` if you want more control:
```bash
VITE_AUDIUS_APP_NAME=your-app-name
```

## Supabase Storage

Uploaded tracks are stored in the `audio-uploads` bucket.

### File Structure

```
audio-uploads/
  {user_id}/
    {track_id}.mp3
```

### Signed URLs

All uploaded track playback uses signed URLs (1-hour expiry) for security.

### Storage Policies

```sql
-- Example: allow users to read their own uploads
CREATE POLICY "Users can read own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'audio-uploads' AND owner = auth.uid());
```

## Authentication Flow

```
User clicks "Sign in with Google"
  → Supabase OAuth (popup or redirect)
  → Redirect to /auth/callback
  → Exchange code for session
  → Redirect to /home
```

### Adding a New OAuth Provider

1. Enable provider in Supabase Auth settings
2. Add provider toggle in `.env`:
   ```bash
   VITE_AUTH_NEWPROVIDER=true
   ```
3. Add provider button in `src/routes/auth.tsx`

## Webhook Endpoints (Future)

The `/api/public/*` route prefix is configured for public webhooks.

Example webhook route:
```typescript
// src/routes/api/public/audius-webhook.ts
export const Route = createFileRoute('/api/public/audius-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify signature, process event
      }
    }
  }
})
```

## Extending the API

Server functions (RPC) live in `src/lib/*.functions.ts`.

Example pattern:
```typescript
import { createServerFn } from "@tanstack/react-start";

export const getUserStats = createServerFn({ method: "GET" })
  .handler(async () => {
    // Server-only code
    return { stats: {} };
  });
```

Call from components:
```typescript
import { useServerFn } from "@tanstack/react-start";
const fetchStats = useServerFn(getUserStats);
```
