import { Router } from 'express';
import {
  adminMe,
  getAdminStats,
  listAdmins,
  createAdmin,
  removeAdmin,
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
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  listBriefings,
  createBriefing,
  updateBriefing,
  deleteBriefing,
  generateBriefing,
  listBriefingEpisodes,
} from '../controllers/b2b.controller';
import { requireAuth } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin';

const router = Router();

// Every admin route requires a valid token AND an allow-listed admin email.
router.use(requireAuth, requireAdmin);

router.get('/me', adminMe);
router.get('/stats', getAdminStats);

// ── Admin accounts (super-admin only) ───────────────────────────────────────
router.get('/admins', requireSuperAdmin, listAdmins);
router.post('/admins', requireSuperAdmin, createAdmin);
router.delete('/admins/:id', requireSuperAdmin, removeAdmin);
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

// ── B2B: clients (sales pipeline) ───────────────────────────────────────────
router.get('/clients', listClients);
router.post('/clients', createClient);
router.patch('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);

// ── B2B: briefings (branded client shows) ───────────────────────────────────
router.get('/briefings', listBriefings);
router.post('/briefings', createBriefing);
router.patch('/briefings/:id', updateBriefing);
router.delete('/briefings/:id', deleteBriefing);
router.post('/briefings/:id/generate', generateBriefing);
router.get('/briefings/:id/episodes', listBriefingEpisodes);

export default router;
