import { AppDataSource } from '../data-source';
import { Subscription } from '../entities/Subscription';

export const SubscriptionRepository = AppDataSource.getRepository(Subscription).extend({
  findForUser(userId: string) {
    return this.findOne({ where: { userId } });
  },
});
