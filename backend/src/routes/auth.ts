import { Router } from 'express';
import * as postgres from '../controllers/authController';
import * as mysql from '../mysql/authController';
import { databaseDriver } from '../config/driver';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const { register, login, getProfile } = databaseDriver === 'mysql' ? mysql : postgres;

router.post('/register', (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();
  return authMiddleware(req, res, () => adminMiddleware(req, res, next));
}, register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

export default router;
