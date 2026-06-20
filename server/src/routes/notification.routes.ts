import { Router } from 'express';
import {
  listNotifications,
  markNotificationsRead,
  registerPushToken,
  unregisterPushToken,
} from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listNotifications);
router.post('/read', requireAuth, markNotificationsRead);
router.post('/register', requireAuth, registerPushToken);
router.delete('/register', requireAuth, unregisterPushToken);

export default router;
