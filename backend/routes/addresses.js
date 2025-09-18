import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { list, create, update, remove } from '../controllers/addressController.js';

const r = Router();
r.get('/', requireAuth(['client','admin']), list);
r.post('/', requireAuth(['client','admin']), create);
r.put('/:id', requireAuth(['client','admin']), update);
r.delete('/:id', requireAuth(['client','admin']), remove);

export default r;
