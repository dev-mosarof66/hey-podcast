import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Topic } from '../entities/Topic';
import { PromoCode } from '../entities/PromoCode';
import { GenerationJob } from '../entities/GenerationJob';
import { User, USER_ROLE } from '../entities/User';
import { EpisodeRepository } from '../repositories/episode.repository';
import { HttpError } from '../utils/http-error';
import { hashPassword } from '../utils/auth';
import { engineEnabled } from '../config/env';
import { generateGlobalDigests, generateTopicDigest } from '../engine/digest';
import { enqueue } from '../engine/worker';

const TRIAL_DAYS = 7;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 8): string {
  let c = '';
  for (let i = 0; i < len; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

// GET /api/admin/me — confirm the caller is an admin (used by the panel).
export async function adminMe(req: Request, res: Response) {
  res.json({ email: req.user!.email, role: req.adminRole ?? 'admin', engineEnabled });
}

// ── Admin accounts (super-admin only) ───────────────────────────────────────

function toPublicAdmin(u: User) {
  return { id: u.id, email: u.email, displayName: u.displayName, role: u.role, createdAt: u.createdAt };
}

// GET /api/admin/admins
export async function listAdmins(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await AppDataSource.getRepository(User).find({
      where: [{ role: 'admin' }, { role: 'super-admin' }],
      order: { createdAt: 'ASC' },
    });
    res.json(users.map(toPublicAdmin));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/admins  { email, password, displayName?, role? }
// Creates a new admin account, or promotes an existing user to admin.
export async function createAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const password = String(req.body.password ?? '');
    const displayName = req.body.displayName ? String(req.body.displayName).trim() : null;
    const role =
      USER_ROLE.includes(req.body.role) && req.body.role !== 'user' ? req.body.role : 'admin';

    if (!email || !email.includes('@')) throw new HttpError(400, 'A valid email is required');

    const repo = AppDataSource.getRepository(User);
    let user = await repo.findOne({ where: { email } });

    if (user) {
      // Promote an existing account; reset password / name only if provided.
      user.role = role;
      if (password) {
        if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
        user.password = await hashPassword(password);
      }
      if (displayName) user.displayName = displayName;
      await repo.save(user);
    } else {
      if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
      user = repo.create({
        email,
        displayName,
        role,
        password: await hashPassword(password),
        emailVerified: true,
        onboarded: true,
      });
      await repo.save(user);
    }

    res.status(201).json(toPublicAdmin(user));
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/admins/:id — revoke admin access (demotes back to 'user').
export async function removeAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, 'Admin not found');
    if (user.id === req.user!.sub) throw new HttpError(400, 'You cannot remove yourself');
    if (user.role === 'super-admin') throw new HttpError(400, 'Cannot remove a super-admin');
    user.role = 'user';
    await repo.save(user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stats — headline counts for the dashboard overview.
export async function getAdminStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const promoRepo = AppDataSource.getRepository(PromoCode);
    const [total, ready, generating, queued, failed, shared, topics, promoCodes, users, redeemRaw] =
      await Promise.all([
        EpisodeRepository.count(),
        EpisodeRepository.count({ where: { status: 'ready' } }),
        EpisodeRepository.count({ where: { status: 'generating' } }),
        EpisodeRepository.count({ where: { status: 'queued' } }),
        EpisodeRepository.count({ where: { status: 'failed' } }),
        EpisodeRepository.count({ where: { isShared: true } }),
        AppDataSource.getRepository(Topic).count(),
        promoRepo.count(),
        AppDataSource.getRepository(User).count(),
        promoRepo
          .createQueryBuilder('p')
          .select('COALESCE(SUM(p.redemptionCount), 0)', 'sum')
          .getRawOne<{ sum: string }>(),
      ]);

    res.json({
      episodes: { total, ready, generating, queued, failed, shared },
      topics,
      promoCodes,
      redemptions: Number(redeemRaw?.sum ?? 0),
      users,
    });
  } catch (err) {
    next(err);
  }
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

// POST /api/admin/episodes/:id/retry — re-queue a failed episode's generation.
// Reuses the same episode row (its `prompt` already holds the topic) and adds
// a fresh job, so the worker re-runs the full pipeline.
export async function retryAdminEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    if (!engineEnabled) throw new HttpError(503, 'Generation engine is not configured');
    const episode = await EpisodeRepository.findOneBy({ id: req.params.id });
    if (!episode) throw new HttpError(404, 'Episode not found');
    if (episode.status !== 'failed') {
      throw new HttpError(409, `Only failed episodes can be retried (this one is '${episode.status}')`);
    }

    episode.status = 'queued';
    await EpisodeRepository.save(episode);

    const jobRepo = AppDataSource.getRepository(GenerationJob);
    await jobRepo.save(jobRepo.create({ episodeId: episode.id, trigger: 'on_demand', status: 'queued' }));

    enqueue(episode.id);
    res.status(202).json({ episodeId: episode.id, status: episode.status });
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
