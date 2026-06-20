import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { TopicFollow } from '../entities/TopicFollow';
import { TopicRepository } from '../repositories/topic.repository';
import { AGE_RANGES, PROFESSIONS } from '../config/personalization';

// GET /api/config — personalization options for the app (with the user's
// followed topics flagged), fetched when the personalization screen shows.
export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const topics = await TopicRepository.findAllOrdered();
    const follows = await AppDataSource.getRepository(TopicFollow).find({ where: { userId } });
    const followed = new Set(follows.map((f) => f.topicId));

    res.json({
      ageRanges: AGE_RANGES,
      professions: PROFESSIONS,
      topics: topics.map((t) => ({
        id: t.id,
        slug: t.slug,
        label: t.label,
        followed: followed.has(t.id),
      })),
    });
  } catch (err) {
    next(err);
  }
}
