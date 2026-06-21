import { Router } from 'express';
import {
  adminMe,
  deleteAdminEpisode,
  deletePromoCode,
  generatePromoCode,
  generateTopicPod,
  listAdminEpisodes,
  listAdminTopics,
  listPromoCodes,
  retryAdminEpisode,
  runGlobalBatch,
  setPromoCodeDisabled,
} from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// Every admin route requires a valid token AND an allow-listed admin email.
router.use(requireAuth, requireAdmin);

router.get('/me', adminMe);
router.get('/topics', listAdminTopics);
router.get('/episodes', listAdminEpisodes);
router.post('/topics/:id/generate', generateTopicPod);
router.post('/global-run', runGlobalBatch);
router.post('/episodes/:id/retry', retryAdminEpisode);
router.delete('/episodes/:id', deleteAdminEpisode);
router.get('/promo-codes', listPromoCodes);
router.post('/promo-codes', generatePromoCode);
router.patch('/promo-codes/:id', setPromoCodeDisabled);
router.delete('/promo-codes/:id', deletePromoCode);

export default router;
