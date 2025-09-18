import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { list, create, update, remove, validate } from '../controllers/couponController.js';

const r = Router();

// Admin CRUD
r.get('/', requireAuth(['admin']), list);
r.post('/', requireAuth(['admin']), create);
r.put('/:id', requireAuth(['admin']), update);
r.delete('/:id', requireAuth(['admin']), remove);

// Validation côté client (publique)
r.post('/validate', validate);

export default r;
