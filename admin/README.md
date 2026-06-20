# Hey Podcast — Admin

A small Next.js panel to generate and manage **global** podcast episodes (the
shared pods every user sees) and monitor generation.

## Setup

1. **Server side** — allow your account into the admin API. In `server/.env`:
   ```
   ADMIN_EMAILS=you@example.com
   ```
   The account must be an **email/password** account (Google-only accounts have
   no password and can't log in here). Restart the server if it doesn't reload.

2. **Admin app** — point it at the API:
   ```
   cp .env.local.example .env.local
   # default NEXT_PUBLIC_API_URL=http://localhost:4000/api is fine when the
   # server runs on the same machine
   ```

3. Run it:
   ```
   npm install
   npm run dev
   ```
   Open http://localhost:3001 and sign in with your admin email/password.

## What it does

- **Generate a global pod** for any topic — fires the real engine
  (Gemini → Deepgram), creating a `isShared` episode that lands in every user's
  feed. "Run all topics" fires one for every topic.
- **Monitor** recent global episodes with live status (queued → generating →
  ready / failed), a link to the audio, and delete.

All admin endpoints live under `/api/admin/*` and require both a valid token and
an allow-listed email (`ADMIN_EMAILS`).
