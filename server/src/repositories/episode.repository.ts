import { AppDataSource } from '../data-source';
import { Episode } from '../entities/Episode';

export const EpisodeRepository = AppDataSource.getRepository(Episode).extend({
  /** Ready episodes for the feed: shared digests + the user's own, newest first. */
  findFeed(userId: string) {
    return this.find({
      where: [
        { status: 'ready', isShared: true },
        { status: 'ready', userId },
      ],
      relations: { topic: true },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: 20,
    });
  },

  findByIdWithTopic(id: string) {
    return this.findOne({ where: { id }, relations: { topic: true } });
  },

  /** Global (shared) ready episodes for a topic — the browsable samples. */
  findSharedByTopic(topicId: string) {
    return this.find({
      where: { status: 'ready', isShared: true, topicId },
      relations: { topic: true },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      take: 30,
    });
  },
});
