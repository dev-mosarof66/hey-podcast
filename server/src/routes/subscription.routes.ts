import { Router } from 'express';
import { getSubscription, subscribe } from '../controllers/subscription.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getSubscription);
router.post('/', requireAuth, subscribe);

export default router;
