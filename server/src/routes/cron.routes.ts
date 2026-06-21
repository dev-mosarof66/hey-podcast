import { Router } from 'express';
import { runCron } from '../controllers/cron.controller';
import { requireCronSecret } from '../middleware/cron-auth';

const router = Router();

// Triggered by an external scheduler; secured by the shared CRON_SECRET.
router.post('/run', requireCronSecret, runCron);

export default router;
