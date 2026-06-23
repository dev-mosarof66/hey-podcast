import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: required('DATABASE_URL'),
  dbSynchronize: process.env.DB_SYNCHRONIZE === 'true',
  dbLogging: process.env.DB_LOGGING === 'true',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // OAuth client id used to verify Google ID tokens sent from the app.
  googleClientId: required('GOOGLE_CLIENT_ID'),
  logLevel: process.env.LOG_LEVEL ?? 'info',

  // Emails (comma-separated) allowed into the admin panel.
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  // Emails promoted to super-admin on boot (can manage other admins).
  superAdminEmails: (process.env.SUPER_ADMIN_EMAILS ?? 'mdmosarofhossain066@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  // ── Generation engine (optional; absent → falls back to placeholder audio) ──
  // Gemini powers the LLM stages (fetch brief + write the two-host script).
  // Supports multiple keys for free-tier failover: tried in order, and on a
  // quota error (429) we fall back to the next. Provide extras via
  // GEMINI_API_KEY_2 / _3, or a comma-separated GEMINI_API_KEYS list.
  // NOTE: the free 20/day limit is PER PROJECT — extra keys only help if they
  // belong to a *different* Google Cloud project/account.
  geminiApiKeys: [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    ...(process.env.GEMINI_API_KEYS ?? '').split(','),
  ]
    .map((k) => (k ?? '').trim())
    .filter(Boolean)
    .filter((k, i, arr) => arr.indexOf(k) === i),
  // Deepgram powers TTS (one voice per host, stitched in Node).
  deepgramApiKey: process.env.DEEPGRAM_API_KEY ?? '',
  // Base URL the mobile app uses to reach this server, for building absolute
  // audio links. Set to your LAN IP in dev, e.g. http://192.168.0.104:4000
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,

  // Cloudinary — audio hosting (CDN). Absent → falls back to local-disk /audio.
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  // Accept either name for the secret (canonical CLOUDINARY_API_SECRET, or the
  // CLOUDINARY_SECRET_KEY some dashboards/users use).
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? process.env.CLOUDINARY_SECRET_KEY ?? '',

  // Per-user digest cron: pre-generate each user's personalized episode.
  // Default 4:30 AM Dhaka. Set to 'off' to disable.
  digestCron: process.env.DIGEST_CRON ?? '30 4 * * *',
  // Global digest cron: pre-generate one shared episode per topic (seen by all
  // users via the feed). Runs earlier, at 2 AM by default. Set to 'off' to disable.
  globalDigestCron: process.env.GLOBAL_DIGEST_CRON ?? '0 2 * * *',
  digestTz: process.env.DIGEST_TZ ?? 'Asia/Dhaka',

  // Shared secret protecting POST /api/cron/run so an external scheduler
  // (GitHub Actions, cron-job.org, Render Cron…) can trigger the digest
  // batches without an expiring admin JWT. Unset → the endpoint is disabled.
  cronSecret: process.env.CRON_SECRET ?? '',
};

/** True only when both engine keys are present — otherwise we stub generation. */
export const engineEnabled = Boolean(env.geminiApiKeys.length && env.deepgramApiKey);

/** True when Cloudinary is configured — otherwise audio is served from local disk. */
export const cloudinaryEnabled = Boolean(
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
);
