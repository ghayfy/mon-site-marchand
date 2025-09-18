import { Router } from 'express';
const router = Router();
const prefixes = ['', '/api'];
for (const p of prefixes) {
  router.get(`${p}/admin/orders`, (_req, res) => {
    res.json({ items: [], total: 0, page: 1, limit: 10 });
  });
  router.get(`${p}/admin/orders/export.csv`, (_req, res) => {
    res.type('text/csv').send('id,status,total\n');
  });
  router.get(`${p}/admin/orders/export.pdf`, (_req, res) => {
    res.type('application/pdf').send('%PDF-1.4\n% stub\n');
  });
  router.get(`${p}/health`, (_req, res) => res.json({ ok: true, from: 'adminOrders' }));
}
export default router;
