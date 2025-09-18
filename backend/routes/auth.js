import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.get('/me', requireAuth(['client','admin']), me);
export default r;
