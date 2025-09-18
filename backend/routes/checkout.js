import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { quote, createIntent, myOrders } from '../controllers/checkoutController.js';

const r = Router();

r.post('/quote', requireAuth(['client','admin']), quote);
r.post('/create-intent', requireAuth(['client','admin']), createIntent);
r.get('/my-orders', requireAuth(['client','admin']), myOrders);

export default r;
