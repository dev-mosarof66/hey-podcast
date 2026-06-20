import { AppDataSource } from '../data-source';
import { EpisodeProgress } from '../entities/EpisodeProgress';

export const EpisodeProgressRepository = AppDataSource.getRepository(EpisodeProgress).extend({
  /** A user's recently-played episodes (with episode + topic), newest first. */
  findRecentForUser(userId: string) {
    return this.find({
      where: { userId },
      relations: { episode: { topic: true } },
      order: { updatedAt: 'DESC' },
      take: 10,
    });
  },

  findOneForUser(userId: string, episodeId: string) {
    return this.findOne({ where: { userId, episodeId } });
  },
});
