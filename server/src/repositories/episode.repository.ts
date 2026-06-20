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

  /**
   * The single episode that powers the home "digest hero": the newest ready
   * episode OWNED BY this user. Excludes shared/global digests (those have a
   * null userId), and reads just one row so the home screen stays light as the
   * episode table grows. Returns null if the user has no episodes yet.
   */
  findHeroForUser(userId: string) {
    return this.findOne({
      where: { status: 'ready', userId },
      relations: { topic: true },
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
    });
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
