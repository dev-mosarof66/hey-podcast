import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../utils/http-error';

/**
 * Guards the external cron entrypoint with a static shared secret. Accepts the
 * secret as either `Authorization: Bearer <secret>` or an `x-cron-secret`
 * header. If CRON_SECRET is unset the endpoint is treated as disabled.
 */
export function requireCronSecret(req: Request, _res: Response, next: NextFunction): void {
  if (!env.cronSecret) {
    return next(new HttpError(503, 'Cron endpoint disabled (set CRON_SECRET)'));
  }
  const auth = req.headers.authorization ?? '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const provided = bearer || (req.headers['x-cron-secret'] as string) || '';
  if (provided !== env.cronSecret) {
    return next(new HttpError(401, 'Invalid cron secret'));
  }
  next();
}
