import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { PushToken } from '../entities/PushToken';
import { Notification } from '../entities/Notification';
import { HttpError } from '../utils/http-error';

// POST /api/notifications/register  { token, platform? }
// Upsert an Expo push token for the current user's device.
export async function registerPushToken(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const token = String(req.body.token ?? '').trim();
    const platform = req.body.platform ? String(req.body.platform) : null;

    if (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken')) {
      throw new HttpError(400, 'A valid Expo push token is required');
    }

    const repo = AppDataSource.getRepository(PushToken);
    const existing = await repo.findOne({ where: { token } });

    if (existing) {
      // Re-point this device to the current user (e.g. after a re-login).
      existing.userId = userId;
      existing.platform = platform;
      await repo.save(existing);
    } else {
      await repo.save(repo.create({ token, userId, platform }));
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications — the user's notification inbox (newest first).
export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const items = await AppDataSource.getRepository(Notification).find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/read — mark all of the user's notifications as read.
export async function markNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    await AppDataSource.getRepository(Notification).update({ userId, read: false }, { read: true });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notifications/register  { token }
// Drop a device token (e.g. on sign-out).
export async function unregisterPushToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = String(req.body.token ?? '').trim();
    if (token) {
      await AppDataSource.getRepository(PushToken).delete({ token });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
