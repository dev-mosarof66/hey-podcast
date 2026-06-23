import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Promote the configured super-admin emails on boot, and make sure every
 * env-allow-listed admin email has at least the 'admin' role. Existing accounts
 * are upgraded in place; emails without an account yet are skipped (they get
 * the role when their account is created via the admin panel).
 */
export async function ensureAdmins(): Promise<void> {
  const repo = AppDataSource.getRepository(User);

  for (const email of env.superAdminEmails) {
    const user = await repo.findOne({ where: { email } });
    if (user && user.role !== 'super-admin') {
      user.role = 'super-admin';
      await repo.save(user);
      logger.info({ email }, 'bootstrap: promoted to super-admin');
    }
  }

  for (const email of env.adminEmails) {
    if (env.superAdminEmails.includes(email)) continue;
    const user = await repo.findOne({ where: { email } });
    if (user && user.role === 'user') {
      user.role = 'admin';
      await repo.save(user);
      logger.info({ email }, 'bootstrap: promoted to admin');
    }
  }
}
