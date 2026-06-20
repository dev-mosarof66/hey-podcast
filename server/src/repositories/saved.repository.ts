import { AppDataSource } from '../data-source';
import { SavedEpisode } from '../entities/SavedEpisode';

export const SavedEpisodeRepository = AppDataSource.getRepository(SavedEpisode).extend({
  /** A user's saved episodes (with episode + topic), newest first. */
  findForUser(userId: string) {
    return this.find({
      where: { userId },
      relations: { episode: { topic: true } },
      order: { savedAt: 'DESC' },
    });
  },

  findOneForUser(userId: string, episodeId: string) {
    return this.findOne({ where: { userId, episodeId } });
  },
});
