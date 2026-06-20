import { Router } from 'express';
import {
  generateDigest,
  generateEpisode,
  getEpisode,
  listEpisodes,
} from '../controllers/episode.controller';
import { listContinue, upsertProgress } from '../controllers/progress.controller';
import { listSaved, toggleSaved } from '../controllers/saved.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listEpisodes);
// Static paths must come before '/:id' so they aren't captured as an id.
router.get('/continue', requireAuth, listContinue);
router.get('/saved', requireAuth, listSaved);
router.post('/generate', requireAuth, generateEpisode);
router.post('/digest', requireAuth, generateDigest);
router.get('/:id', requireAuth, getEpisode);
router.put('/:id/progress', requireAuth, upsertProgress);
router.put('/:id/saved', requireAuth, toggleSaved);

export default router;
