import { Router } from 'express';
import { redeemPromo } from '../controllers/promo.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/redeem', requireAuth, redeemPromo);

export default router;
