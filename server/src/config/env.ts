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

  // ── Generation engine (optional; absent → falls back to placeholder audio) ──
  // Gemini powers the LLM stages (fetch brief + write the two-host script).
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
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
};

/** True only when both engine keys are present — otherwise we stub generation. */
export const engineEnabled = Boolean(env.geminiApiKey && env.deepgramApiKey);

/** True when Cloudinary is configured — otherwise audio is served from local disk. */
export const cloudinaryEnabled = Boolean(
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
);
