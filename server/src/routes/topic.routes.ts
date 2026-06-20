import { Router } from 'express';
import {
  listBrowseTopics,
  listTopicEpisodes,
  listTopics,
  setMyTopics,
} from '../controllers/topic.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listTopics);
router.get('/browse', requireAuth, listBrowseTopics);
router.put('/follows', requireAuth, setMyTopics);
router.get('/:id/episodes', requireAuth, listTopicEpisodes);

export default router;
