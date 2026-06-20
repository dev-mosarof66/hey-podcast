import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { TopicFollow } from '../entities/TopicFollow';
import { TopicRepository } from '../repositories/topic.repository';
import { EpisodeRepository } from '../repositories/episode.repository';

const followRepo = () => AppDataSource.getRepository(TopicFollow);

// GET /api/topics — all topics, each flagged with whether the user follows it.
export async function listTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const topics = await TopicRepository.findAllOrdered();
    const follows = await followRepo().find({ where: { userId } });
    const followed = new Set(follows.map((f) => f.topicId));

    res.json(
      topics.map((t) => ({
        id: t.id,
        slug: t.slug,
        label: t.label,
        followed: followed.has(t.id),
      }))
    );
  } catch (err) {
    next(err);
  }
}

// GET /api/topics/browse — only topics the user does NOT follow yet.
export async function listBrowseTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const topics = await TopicRepository.findAllOrdered();
    const follows = await followRepo().find({ where: { userId } });
    const followedIds = new Set(follows.map((f) => f.topicId));

    res.json(
      topics
        .filter((t) => !followedIds.has(t.id))
        .map((t) => ({ id: t.id, slug: t.slug, label: t.label }))
    );
  } catch (err) {
    next(err);
  }
}

// GET /api/topics/:id/episodes — global (shared) episodes for a topic, so the
// user can preview a topic's pods before following it.
export async function listTopicEpisodes(req: Request, res: Response, next: NextFunction) {
  try {
    const episodes = await EpisodeRepository.findSharedByTopic(req.params.id);
    res.json(episodes);
  } catch (err) {
    next(err);
  }
}

// PUT /api/topics/follows  { topicIds: string[] }
// Replaces the user's followed topics with exactly this set.
export async function setMyTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const requested: string[] = Array.isArray(req.body.topicIds) ? req.body.topicIds : [];

    // Only allow ids that actually exist.
    const all = await TopicRepository.findAllOrdered();
    const validIds = new Set(all.map((t) => t.id));
    const wanted = new Set(requested.filter((id) => validIds.has(id)));

    const repo = followRepo();
    const existing = await repo.find({ where: { userId } });
    const existingIds = new Set(existing.map((f) => f.topicId));

    const toRemove = existing.filter((f) => !wanted.has(f.topicId));
    if (toRemove.length) await repo.remove(toRemove);

    const toAdd = [...wanted]
      .filter((topicId) => !existingIds.has(topicId))
      .map((topicId) => repo.create({ userId, topicId }));
    if (toAdd.length) await repo.save(toAdd);

    res.json({ topicIds: [...wanted] });
  } catch (err) {
    next(err);
  }
}
