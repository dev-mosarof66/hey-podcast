import { Router } from 'express';
import {
  adminMe,
  deleteAdminEpisode,
  generateTopicPod,
  listAdminEpisodes,
  listAdminTopics,
  runGlobalBatch,
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
router.delete('/episodes/:id', deleteAdminEpisode);

export default router;
