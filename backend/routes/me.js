import express from 'express';
import { requireJwt } from '../middlewares/authJwt.js';
import { User } from '../models/User.js';

const router = express.Router();

router.get('/me', requireJwt, async (req, res) => {
  const user = await User.findByPk(req.user.sub, { attributes: ['id','email','role','created_at'] });
  res.json(user || null);
});

export default router;
