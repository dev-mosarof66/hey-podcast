import { Router } from 'express';
import authRoutes from './auth.routes';
import episodeRoutes from './episode.routes';
import topicRoutes from './topic.routes';
import subscriptionRoutes from './subscription.routes';
import configRoutes from './config.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/episodes', episodeRoutes);
router.use('/topics', topicRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/config', configRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
