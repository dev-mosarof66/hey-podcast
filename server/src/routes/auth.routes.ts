import { Router } from 'express';
import {
  deleteMe,
  googleLogin,
  login,
  me,
  register,
  updateMe,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, updateMe);
router.delete('/me', requireAuth, deleteMe);

export default router;
