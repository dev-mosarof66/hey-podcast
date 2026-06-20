import { Router } from 'express';
import { getConfig } from '../controllers/config.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getConfig);

export default router;
