import { NextFunction, Request, Response } from 'express';
import { EpisodeProgressRepository } from '../repositories/progress.repository';

// PUT /api/episodes/:id/progress  { positionSec, completed? }
export async function upsertProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const episodeId = req.params.id;
    const positionSec = Math.max(0, Number(req.body.positionSec ?? 0));
    const completed = Boolean(req.body.completed);

    let progress = await EpisodeProgressRepository.findOneForUser(userId, episodeId);
    if (!progress) {
      progress = EpisodeProgressRepository.create({ userId, episodeId, positionSec, completed });
    } else {
      progress.positionSec = positionSec;
      progress.completed = completed;
    }
    await EpisodeProgressRepository.save(progress);
    res.json(progress);
  } catch (err) {
    next(err);
  }
}

// GET /api/episodes/continue — recently-played episodes for the feed's activity row.
export async function listContinue(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await EpisodeProgressRepository.findRecentForUser(req.user!.sub);
    const items = rows
      .filter((r) => r.episode)
      .map((r) => ({ ...r.episode, progressSec: r.positionSec, completed: r.completed }));
    res.json(items);
  } catch (err) {
    next(err);
  }
}
