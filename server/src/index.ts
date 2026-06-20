import 'reflect-metadata';
import { createApp } from './app';
import { AppDataSource } from './data-source';
import { env, engineEnabled, cloudinaryEnabled } from './config/env';
import { logger } from './config/logger';
import { seed } from './seed';
import { ensureAudioDir } from './engine/storage';
import { resumePending } from './engine/worker';
import { startScheduler } from './scheduler';

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected (NeonDB)');

    await seed();

    // Engine: make sure the audio dir exists and pick up any unfinished jobs.
    ensureAudioDir();
    logger.info(
      engineEnabled
        ? 'Generation engine: ENABLED (Gemini + Deepgram)'
        : 'Generation engine: disabled (no GEMINI_API_KEY/DEEPGRAM_API_KEY) — using placeholder audio'
    );
    if (engineEnabled) await resumePending();

    logger.info(
      cloudinaryEnabled
        ? 'Audio hosting: Cloudinary (CDN)'
        : 'Audio hosting: local disk /audio (set CLOUDINARY_* to use the CDN)'
    );

    // Daily-digest cron (4:30 AM by default) — pre-generates each user's episode.
    startScheduler();

    const app = createApp();
    app.listen(env.port, () => {
      logger.info(`Server listening on http://localhost:${env.port}`);
      logger.info(`Health check: http://localhost:${env.port}/api/health`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

void bootstrap();
