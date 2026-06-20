import { Router } from 'express';
import {
  generateDigest,
  generateEpisode,
  getDigestHero,
  getEpisode,
  listEpisodes,
} from '../controllers/episode.controller';
import { getStats, listContinue, upsertProgress } from '../controllers/progress.controller';
import { listSaved, toggleSaved } from '../controllers/saved.controller';
import { requireAuth } from '../middleware/auth';
import { requirePremium } from '../middleware/require-premium';

const router = Router();

router.get('/', requireAuth, listEpisodes);
// Static paths must come before '/:id' so they aren't captured as an id.
router.get('/digest-hero', requireAuth, getDigestHero);
router.get('/stats', requireAuth, getStats);
router.get('/continue', requireAuth, listContinue);
router.get('/saved', requireAuth, listSaved);
// On-demand "create anything" is a premium feature; the daily digest is free.
router.post('/generate', requireAuth, requirePremium, generateEpisode);
router.post('/digest', requireAuth, generateDigest);
router.get('/:id', requireAuth, getEpisode);
router.put('/:id/progress', requireAuth, upsertProgress);
router.put('/:id/saved', requireAuth, toggleSaved);

export default router;
