import { AppDataSource } from '../data-source';
import { Topic } from '../entities/Topic';

export const TopicRepository = AppDataSource.getRepository(Topic).extend({
  findAllOrdered() {
    return this.find({ order: { label: 'ASC' } });
  },
});
