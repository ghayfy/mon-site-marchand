import { Router } from 'express';
const router = Router();
const prefixes = ['', '/api'];
for (const p of prefixes) {
  router.get(`${p}/admin/products`, (_req, res) => {
    res.json({ items: [{ id: 1, name: 'Demo product', price: 9.99 }], total: 1 });
  });
  router.get(`${p}/health`, (_req, res) => res.json({ ok: true, from: 'adminCatalog' }));
}
export default router;
