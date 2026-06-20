import { NextFunction, Request, Response } from 'express';
import { SubscriptionRepository } from '../repositories/subscription.repository';

const FREE = { tier: 'free', status: 'active', renewsAt: null };

// GET /api/subscription — the user's plan (defaults to free).
export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await SubscriptionRepository.findForUser(req.user!.sub);
    res.json(sub ?? FREE);
  } catch (err) {
    next(err);
  }
}

// POST /api/subscription  { plan: 'monthly' | 'yearly' }
// Mock checkout — no real payment yet; just marks the user premium.
export async function subscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const yearly = req.body.plan === 'yearly';
    const renewsAt = new Date(Date.now() + (yearly ? 365 : 30) * 86_400_000);

    let sub = await SubscriptionRepository.findForUser(userId);
    if (!sub) {
      sub = SubscriptionRepository.create({ userId, tier: 'premium', status: 'active', renewsAt });
    } else {
      sub.tier = 'premium';
      sub.status = 'active';
      sub.renewsAt = renewsAt;
    }
    await SubscriptionRepository.save(sub);
    res.json(sub);
  } catch (err) {
    next(err);
  }
}
