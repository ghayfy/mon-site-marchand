import { Router } from 'express';
import { createIntent } from '../controllers/stripeController.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();
// client → crée un PaymentIntent à partir du panier courant
r.post('/create-intent', requireAuth(['client', 'admin']), createIntent);

export default r;
