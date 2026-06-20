import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { PromoCode } from '../entities/PromoCode';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { HttpError } from '../utils/http-error';

// POST /api/promo/redeem  { code }
// Redeem a one-time promo code → grants the user a free premium trial.
export async function redeemPromo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const code = String(req.body.code ?? '')
      .trim()
      .toUpperCase();
    if (!code) throw new HttpError(400, 'A promo code is required');

    const repo = AppDataSource.getRepository(PromoCode);
    const promo = await repo.findOne({ where: { code } });
    if (!promo) throw new HttpError(404, 'Invalid promo code');
    if (promo.disabled) throw new HttpError(403, 'This code is no longer active');
    if (promo.redeemed) throw new HttpError(409, 'This code has already been used');

    // Grant / extend a premium trial.
    const renewsAt = new Date(Date.now() + promo.trialDays * 86_400_000);
    let sub = await SubscriptionRepository.findForUser(userId);
    if (!sub) {
      sub = SubscriptionRepository.create({
        userId,
        tier: 'premium',
        status: 'trialing',
        renewsAt,
      });
    } else {
      sub.tier = 'premium';
      sub.status = 'trialing';
      sub.renewsAt = renewsAt;
    }
    await SubscriptionRepository.save(sub);

    // Burn the code.
    promo.redeemed = true;
    promo.redeemedBy = userId;
    promo.redeemedAt = new Date();
    await repo.save(promo);

    res.json({
      tier: sub.tier,
      status: sub.status,
      renewsAt: sub.renewsAt,
      trialDays: promo.trialDays,
    });
  } catch (err) {
    next(err);
  }
}
