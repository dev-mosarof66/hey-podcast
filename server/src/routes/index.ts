import { Router } from 'express';
import authRoutes from './auth.routes';
import episodeRoutes from './episode.routes';
import topicRoutes from './topic.routes';
import subscriptionRoutes from './subscription.routes';
import configRoutes from './config.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import promoRoutes from './promo.routes';
import cronRoutes from './cron.routes';
import { getBriefingFeed } from '../controllers/feed.controller';
import { engineEnabled, cloudinaryEnabled, env } from '../config/env';

const router = Router();

router.get('/health', (_req, res) => {
  // Booleans/counts only — no secret values — so you can verify live config.
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    engine: {
      enabled: engineEnabled, // both Gemini + Deepgram present → real generation
      geminiKeys: env.geminiApiKeys.length,
      deepgram: Boolean(env.deepgramApiKey),
      cloudinary: cloudinaryEnabled, // else audio → ephemeral local disk (lost on Render)
      cronSecret: Boolean(env.cronSecret),
    },
  });
});

router.use('/auth', authRoutes);
router.use('/episodes', episodeRoutes);
router.use('/topics', topicRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/config', configRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/promo', promoRoutes);
router.use('/cron', cronRoutes);

// Public podcast RSS feed for a B2B briefing (no auth — add to Spotify/Apple).
router.get('/feed/:slug', getBriefingFeed);

export default router;
