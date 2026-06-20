import cron from 'node-cron';
import { env, engineEnabled } from './config/env';
import { logger } from './config/logger';
import { generateDailyDigests, generateGlobalDigests } from './engine/digest';

/** Register one cron job, with validation and an 'off' kill-switch. */
function schedule(name: string, expression: string, run: () => Promise<void>): void {
  if (expression.toLowerCase() === 'off') {
    logger.info(`${name}: disabled (schedule set to 'off')`);
    return;
  }
  if (!cron.validate(expression)) {
    logger.error({ expression }, `${name}: invalid schedule — not started`);
    return;
  }
  cron.schedule(
    expression,
    () => {
      logger.info(`${name}: firing`);
      run().catch((err) => logger.error({ err }, `${name}: run failed`));
    },
    { timezone: env.digestTz, name, noOverlap: true }
  );
  logger.info({ schedule: expression, tz: env.digestTz }, `${name}: scheduled`);
}

/**
 * Start the generation crons (no-op if the engine isn't configured):
 *  - global digest (2 AM): one shared episode per topic, for everyone
 *  - user digest  (4:30 AM): each user's personalized episode
 * Global runs first so shared content is fresh before the per-user pass.
 */
export function startScheduler(): void {
  if (!engineEnabled) {
    logger.info('crons: not started (engine disabled — set GEMINI/DEEPGRAM keys)');
    return;
  }
  schedule('global-digest cron', env.globalDigestCron, generateGlobalDigests);
  schedule('user-digest cron', env.digestCron, generateDailyDigests);
}
