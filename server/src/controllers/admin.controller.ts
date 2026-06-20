import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Topic } from '../entities/Topic';
import { PromoCode } from '../entities/PromoCode';
import { EpisodeRepository } from '../repositories/episode.repository';
import { HttpError } from '../utils/http-error';
import { engineEnabled } from '../config/env';
import { generateGlobalDigests, generateTopicDigest } from '../engine/digest';

const TRIAL_DAYS = 7;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 8): string {
  let c = '';
  for (let i = 0; i < len; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

// GET /api/admin/me — confirm the caller is an admin (used by the panel).
export async function adminMe(req: Request, res: Response) {
  res.json({ email: req.user!.email, engineEnabled });
}

// GET /api/admin/topics — all topics.
export async function listAdminTopics(_req: Request, res: Response, next: NextFunction) {
  try {
    const topics = await AppDataSource.getRepository(Topic).find({ order: { label: 'ASC' } });
    res.json(topics.map((t) => ({ id: t.id, slug: t.slug, label: t.label })));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/topics/:id/generate — fire a global (shared) pod for a topic.
export async function generateTopicPod(req: Request, res: Response, next: NextFunction) {
  try {
    if (!engineEnabled) throw new HttpError(503, 'Generation engine is not configured');
    const topic = await AppDataSource.getRepository(Topic).findOneBy({ id: req.params.id });
    if (!topic) throw new HttpError(404, 'Topic not found');

    const episodeId = await generateTopicDigest(topic.id, topic.label, 'on_demand');
    res.status(202).json({ episodeId });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/global-run — fire a global pod for every topic (the cron job).
export async function runGlobalBatch(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!engineEnabled) throw new HttpError(503, 'Generation engine is not configured');
    await generateGlobalDigests();
    res.status(202).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/episodes — recent global (shared) episodes, any status.
export async function listAdminEpisodes(_req: Request, res: Response, next: NextFunction) {
  try {
    const episodes = await EpisodeRepository.find({
      where: { isShared: true },
      relations: { topic: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    res.json(episodes);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/episodes/:id
export async function deleteAdminEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    await EpisodeRepository.delete({ id: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/promo-codes — generate a one-time 7-day free-trial code.
export async function generatePromoCode(_req: Request, res: Response, next: NextFunction) {
  try {
    const repo = AppDataSource.getRepository(PromoCode);
    let code = randomCode();
    for (let i = 0; i < 5 && (await repo.findOne({ where: { code } })); i++) {
      code = randomCode();
    }
    const promo = repo.create({ code, trialDays: TRIAL_DAYS });
    await repo.save(promo);
    res.status(201).json(promo);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/promo-codes — recent promo codes with redemption status.
export async function listPromoCodes(_req: Request, res: Response, next: NextFunction) {
  try {
    const codes = await AppDataSource.getRepository(PromoCode).find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    res.json(codes);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/promo-codes/:id  { disabled } — enable/disable a code.
export async function setPromoCodeDisabled(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = AppDataSource.getRepository(PromoCode);
    const promo = await repo.findOneBy({ id: req.params.id });
    if (!promo) throw new HttpError(404, 'Promo code not found');
    promo.disabled = Boolean(req.body.disabled);
    await repo.save(promo);
    res.json(promo);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/promo-codes/:id — permanently remove a code.
export async function deletePromoCode(req: Request, res: Response, next: NextFunction) {
  try {
    await AppDataSource.getRepository(PromoCode).delete({ id: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
