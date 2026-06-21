import { NextFunction, Request, Response } from 'express';
import { engineEnabled } from '../config/env';
import { logger } from '../config/logger';
import { generateDailyDigests, generateGlobalDigests } from '../engine/digest';
import { HttpError } from '../utils/http-error';

const JOBS = ['global', 'user', 'all'] as const;
type Job = (typeof JOBS)[number];

// POST /api/cron/run?job=global|user|all  (Authorization: Bearer <CRON_SECRET>)
// External-scheduler entrypoint. Mirrors the in-process scheduler: 'global'
// runs the shared per-topic batch, 'user' the per-user batch, 'all' both
// (global first, like the cron order). Both batches are idempotent, so it's
// safe to run even if the in-process cron also fires.
export async function runCron(req: Request, res: Response, next: NextFunction) {
  try {
    if (!engineEnabled) throw new HttpError(503, 'Generation engine is not configured');

    const job = String(req.query.job ?? req.body?.job ?? 'all').toLowerCase() as Job;
    if (!JOBS.includes(job)) {
      throw new HttpError(400, "job must be one of 'global', 'user', 'all'");
    }

    logger.info({ job }, 'cron endpoint: triggered');
    // Generation is slow (queues async work); ack immediately and run after.
    res.status(202).json({ ok: true, job });

    void (async () => {
      if (job === 'global' || job === 'all') await generateGlobalDigests();
      if (job === 'user' || job === 'all') await generateDailyDigests();
      logger.info({ job }, 'cron endpoint: batch queued');
    })().catch((err) => logger.error({ err, job }, 'cron endpoint: run failed'));
  } catch (err) {
    next(err);
  }
}
