import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Client, CLIENT_STATUS, ClientStatus } from '../entities/Client';
import { Briefing } from '../entities/Briefing';
import { EpisodeRepository } from '../repositories/episode.repository';
import { HttpError } from '../utils/http-error';
import { engineEnabled } from '../config/env';
import { generateBriefingEpisode } from '../engine/digest';

const clientRepo = () => AppDataSource.getRepository(Client);
const briefingRepo = () => AppDataSource.getRepository(Briefing);

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'briefing'
  );
}

// ── Clients ────────────────────────────────────────────────────────────────

// GET /api/admin/clients
export async function listClients(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await clientRepo().find({ order: { createdAt: 'DESC' } }));
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/clients
export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const name = String(req.body.name ?? '').trim();
    if (!name) throw new HttpError(400, 'A client name is required');
    const repo = clientRepo();
    const client = repo.create({
      name,
      company: req.body.company?.trim() || null,
      contactEmail: req.body.contactEmail?.trim() || null,
      status: CLIENT_STATUS.includes(req.body.status) ? (req.body.status as ClientStatus) : 'prospect',
      monthlyPrice: Math.max(0, Number(req.body.monthlyPrice ?? 0)) || 0,
      notes: req.body.notes?.trim() || null,
    });
    await repo.save(client);
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/clients/:id
export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = clientRepo();
    const client = await repo.findOneBy({ id: req.params.id });
    if (!client) throw new HttpError(404, 'Client not found');
    const b = req.body;
    if (b.name !== undefined) client.name = String(b.name).trim() || client.name;
    if (b.company !== undefined) client.company = b.company?.trim() || null;
    if (b.contactEmail !== undefined) client.contactEmail = b.contactEmail?.trim() || null;
    if (b.status !== undefined && CLIENT_STATUS.includes(b.status)) client.status = b.status;
    if (b.monthlyPrice !== undefined) client.monthlyPrice = Math.max(0, Number(b.monthlyPrice) || 0);
    if (b.notes !== undefined) client.notes = b.notes?.trim() || null;
    await repo.save(client);
    res.json(client);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/clients/:id  (cascades to its briefings)
export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await clientRepo().delete({ id: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ── Briefings ──────────────────────────────────────────────────────────────

// GET /api/admin/briefings
export async function listBriefings(_req: Request, res: Response, next: NextFunction) {
  try {
    const briefings = await briefingRepo().find({
      relations: { client: true },
      order: { createdAt: 'DESC' },
    });
    // Attach a lightweight episode count per briefing.
    const withCounts = await Promise.all(
      briefings.map(async (b) => ({
        ...b,
        episodeCount: await EpisodeRepository.count({ where: { briefingId: b.id } }),
      }))
    );
    res.json(withCounts);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/briefings
export async function createBriefing(req: Request, res: Response, next: NextFunction) {
  try {
    const title = String(req.body.title ?? '').trim();
    const prompt = String(req.body.prompt ?? '').trim();
    if (!title) throw new HttpError(400, 'A title is required');
    if (!prompt) throw new HttpError(400, 'A prompt (what to research) is required');

    const repo = briefingRepo();
    let slug = slugify(title);
    for (let i = 2; i < 50 && (await repo.findOne({ where: { slug } })); i++) {
      slug = `${slugify(title)}-${i}`;
    }

    const briefing = repo.create({
      title,
      prompt,
      slug,
      description: req.body.description?.trim() || null,
      clientId: req.body.clientId || null,
      active: req.body.active !== false,
    });
    await repo.save(briefing);
    res.status(201).json(briefing);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/briefings/:id
export async function updateBriefing(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = briefingRepo();
    const briefing = await repo.findOneBy({ id: req.params.id });
    if (!briefing) throw new HttpError(404, 'Briefing not found');
    const b = req.body;
    if (b.title !== undefined) briefing.title = String(b.title).trim() || briefing.title;
    if (b.prompt !== undefined) briefing.prompt = String(b.prompt).trim() || briefing.prompt;
    if (b.description !== undefined) briefing.description = b.description?.trim() || null;
    if (b.clientId !== undefined) briefing.clientId = b.clientId || null;
    if (b.active !== undefined) briefing.active = Boolean(b.active);
    await repo.save(briefing);
    res.json(briefing);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/briefings/:id
export async function deleteBriefing(req: Request, res: Response, next: NextFunction) {
  try {
    await briefingRepo().delete({ id: req.params.id });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/briefings/:id/generate — produce a new episode for the feed.
export async function generateBriefing(req: Request, res: Response, next: NextFunction) {
  try {
    if (!engineEnabled) throw new HttpError(503, 'Generation engine is not configured');
    const briefing = await briefingRepo().findOneBy({ id: req.params.id });
    if (!briefing) throw new HttpError(404, 'Briefing not found');
    const episodeId = await generateBriefingEpisode(briefing);
    res.status(202).json({ episodeId });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/briefings/:id/episodes
export async function listBriefingEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const episodes = await EpisodeRepository.find({
      where: { briefingId: req.params.id },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    res.json(episodes);
  } catch (err) {
    next(err);
  }
}
