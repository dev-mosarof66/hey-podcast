import { NextFunction, Request, Response } from 'express';
import { SavedEpisodeRepository } from '../repositories/saved.repository';

// GET /api/episodes/saved — the user's saved (and downloaded) episodes.
export async function listSaved(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await SavedEpisodeRepository.findForUser(req.user!.sub);
    const items = rows
      .filter((r) => r.episode)
      .map((r) => ({ ...r.episode, downloaded: r.downloaded }));
    res.json(items);
  } catch (err) {
    next(err);
  }
}

// PUT /api/episodes/:id/saved  { saved: boolean }
export async function toggleSaved(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const episodeId = req.params.id;
    const saved = Boolean(req.body.saved);

    const existing = await SavedEpisodeRepository.findOneForUser(userId, episodeId);
    if (saved && !existing) {
      await SavedEpisodeRepository.save(
        SavedEpisodeRepository.create({ userId, episodeId, downloaded: false })
      );
    } else if (!saved && existing) {
      await SavedEpisodeRepository.remove(existing);
    }

    res.json({ episodeId, saved });
  } catch (err) {
    next(err);
  }
}
