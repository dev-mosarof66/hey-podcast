# Deploying the API to Render

The backend deploys as a Render **Web Service**, configured by
[`render.yaml`](../render.yaml) at the repo root (a Render Blueprint).

## One-time setup

1. Push this repo to GitHub.
2. In Render: **New +** → **Blueprint** → select the repo. Render reads
   `render.yaml` and creates the `hey-podcast-api` service.
3. Fill in the secrets it marks as required (everything with `sync: false`):

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | ✅ | Neon connection string, must end with `?sslmode=require` |
   | `GOOGLE_CLIENT_ID` | ✅ | Google OAuth **Web** client id |
   | `PUBLIC_URL` | ✅ | This service's URL, e.g. `https://hey-podcast-api.onrender.com` |
   | `GEMINI_API_KEY` | optional | Without it (or Deepgram), generation uses placeholder audio |
   | `DEEPGRAM_API_KEY` | optional | TTS voices |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | recommended | See caveat below |

   `JWT_SECRET` is generated automatically by Render and persists across deploys.

4. Deploy. Render runs `npm ci && npm run build`, then `npm run start`, and
   waits for `GET /api/health` to return `200` before routing traffic.

5. Point the mobile app at the live URL by setting `EXPO_PUBLIC_API_URL` to
   `https://hey-podcast-api.onrender.com` in the `mobile` build config.

## Render-specific caveats

- **Ephemeral filesystem.** Render does not persist the local `/audio` directory
  across deploys or restarts. Configure **Cloudinary** so generated audio is
  served from the CDN — otherwise links break on every redeploy. (Alternatively,
  attach a Render persistent disk and a paid plan.)

- **Free plan sleeps.** A free service spins down after inactivity, so the
  in-process `node-cron` digest jobs (`DIGEST_CRON`, `GLOBAL_DIGEST_CRON`) only
  fire while it happens to be awake. For reliable pre-generation, either move to
  a paid instance type that stays warm, or run the digest via a separate Render
  **Cron Job**. Set the schedules to `off` if you don't need them.

## Schema / migrations

There are no migrations yet, so `DB_SYNCHRONIZE=true` lets TypeORM create the
schema on first boot. Once you add migrations under `src/migrations`, set
`DB_SYNCHRONIZE=false` and run them as part of the build:

```
buildCommand: npm ci && npm run build && npm run migration:run
```
