import { Router } from 'express';
import * as ctrl from '../controllers/promoController.js';
import { requireAuth } from '../middlewares/auth.js';
const r = Router();
r.get('/', ctrl.list);
r.post('/', requireAuth('admin'), ctrl.create);
r.put('/:id', requireAuth('admin'), ctrl.update);
r.delete('/:id', requireAuth('admin'), ctrl.remove);
export default r;
