import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error';
import { env } from '../config/env';

/** Gate a route to admin accounts (must run after requireAuth). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const email = req.user?.email?.toLowerCase();
  if (!email || !env.adminEmails.includes(email)) {
    return next(new HttpError(403, 'Admin access required'));
  }
  next();
}
