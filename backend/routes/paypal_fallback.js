import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { capture } from '../controllers/paypalController.js';

const r = Router();

// Préflight (évite 405 côté navigateur/vite-proxy)
r.options('/capture', (req, res) => res.sendStatus(204));
r.options('/capture/:paypalOrderId', (req, res) => res.sendStatus(204));

// GET /api/paypal/capture?token=... (retour PayPal via query string)
r.get('/capture', requireAuth(['client','admin']), (req, res, next) => {
  const q = req.query || {};
  req.params = req.params || {};
  req.params.paypalOrderId = q.token || q.orderId || q.paypalOrderId;
  return capture(req, res, next);
});

// GET /api/paypal/capture/:paypalOrderId (variante avec path param)
r.get('/capture/:paypalOrderId', requireAuth(['client','admin']), (req, res, next) => {
  return capture(req, res, next);
});

// POST /api/paypal/capture { token | orderId | paypalOrderId }
r.post('/capture', requireAuth(['client','admin']), (req, res, next) => {
  const b = req.body || {};
  req.params = req.params || {};
  req.params.paypalOrderId = b.paypalOrderId || b.orderId || b.token;
  return capture(req, res, next);
});

export default r;
