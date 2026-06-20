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

  /** Lifetime listening totals across ALL of a user's progress rows. */
  statsForUser(userId: string): Promise<{ episodes: string; seconds: string }> {
    return this.createQueryBuilder('p')
      .select('COUNT(*)', 'episodes')
      .addSelect('COALESCE(SUM(p.positionSec), 0)', 'seconds')
      .where('p.userId = :userId', { userId })
      .getRawOne() as Promise<{ episodes: string; seconds: string }>;
  },
});
