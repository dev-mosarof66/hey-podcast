import { AppDataSource } from '../data-source';
import { User } from '../entities/User';

/**
 * User repository — the standard TypeORM 0.3 way to attach custom query
 * methods to an entity's repository (replaces the deprecated
 * @EntityRepository). Imported by controllers instead of getRepository().
 */
export const UserRepository = AppDataSource.getRepository(User).extend({
  findByEmail(email: string) {
    return this.findOneBy({ email });
  },

  findByGoogleId(googleId: string) {
    return this.findOneBy({ googleId });
  },

  // `password` is select:false, so fetch it explicitly for login.
  findByEmailWithPassword(email: string) {
    return this.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  },

  existsByEmail(email: string) {
    return this.existsBy({ email });
  },
});
