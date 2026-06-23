import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error';
import { env } from '../config/env';
import { AppDataSource } from '../data-source';
import { User, type UserRole } from '../entities/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Resolved admin role for the current request (set by requireAdmin). */
      adminRole?: UserRole;
    }
  }
}

/**
 * Gate a route to admin accounts (must run after requireAuth). An account is an
 * admin if its DB role is 'admin'/'super-admin', OR its email is in the
 * ADMIN_EMAILS allow-list (env fallback / bootstrap). The resolved role is
 * attached to req.adminRole for downstream super-admin checks.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const sub = req.user?.sub;
    const email = req.user?.email?.toLowerCase();
    if (!sub) return next(new HttpError(401, 'Authentication required'));

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: sub } });
    const role: UserRole | undefined = user?.role;
    const isEnvAdmin = !!email && env.adminEmails.includes(email);

    if (role === 'super-admin') {
      req.adminRole = 'super-admin';
      return next();
    }
    if (role === 'admin' || isEnvAdmin) {
      req.adminRole = 'admin';
      return next();
    }
    return next(new HttpError(403, 'Admin access required'));
  } catch (err) {
    next(err);
  }
}

/** Gate a route to super-admins only (must run after requireAdmin). */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.adminRole !== 'super-admin') {
    return next(new HttpError(403, 'Super-admin access required'));
  }
  next();
}
