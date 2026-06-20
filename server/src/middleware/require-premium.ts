import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error';
import { SubscriptionRepository } from '../repositories/subscription.repository';


export async function requirePremium(req: Request, _res: Response, next: NextFunction) {
  try {
    const sub = await SubscriptionRepository.findForUser(req.user!.sub);

    const activeStatus = sub?.status === 'active' || sub?.status === 'trialing';
    const notExpired = !sub?.renewsAt || sub.renewsAt.getTime() > Date.now();
    const isPremium = sub?.tier === 'premium' && activeStatus && notExpired;

    if (!isPremium) {
      return next(new HttpError(402, 'This feature requires an active premium subscription'));
    }

    req.subscription = sub;
    next();
  } catch (err) {
    next(err);
  }
}

declare global {
  namespace Express {
    interface Request {
      /** Set by requirePremium once the user's premium status is verified. */
      subscription?: import('../entities/Subscription').Subscription | null;
    }
  }
}
