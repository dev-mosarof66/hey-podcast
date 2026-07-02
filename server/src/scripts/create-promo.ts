import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { PromoCode } from '../entities/PromoCode';

/**
 * Mint a promo code directly in the DB — no admin auth / HTTP required.
 * Run: npm run promo:create           (7-day trial, random code)
 *      npm run promo:create -- 30      (30-day trial)
 *      npm run promo:create -- 30 LAUNCH30   (custom code)
 *
 * Mirrors the admin endpoint's format so codes are interchangeable. Intended
 * for operators with server/DB access, so no public endpoint is exposed.
 */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = (len = 6): string =>
  Array.from({ length: len }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

async function main() {
  const [daysArg, codeArg] = process.argv.slice(2);
  const trialDays = Number(daysArg) > 0 ? Math.floor(Number(daysArg)) : 7;

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(PromoCode);

  let code = (codeArg ?? '').trim().toUpperCase() || randomCode();
  // Avoid colliding with an existing code (retry a few times for the random case).
  for (let i = 0; i < 5 && (await repo.findOne({ where: { code } })); i++) {
    if (codeArg) throw new Error(`Promo code "${code}" already exists`);
    code = randomCode();
  }

  const promo = await repo.save(repo.create({ code, trialDays }));
  // eslint-disable-next-line no-console
  console.log(`\n✅ Promo code created:\n   CODE:  ${promo.code}\n   TRIAL: ${promo.trialDays} days\n`);

  await AppDataSource.destroy();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to create promo code:', err instanceof Error ? err.message : err);
  await AppDataSource.destroy().catch(() => {});
  process.exit(1);
});
