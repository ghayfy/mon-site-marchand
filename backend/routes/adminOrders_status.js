const express = require('express');
const router = express.Router();
const VALID = new Set(['PAID', 'SHIPPED', 'CANCELLED']);
router.put('/admin/orders/:id/status', express.json(), (req, res) => {
  const id = String(req.params.id || '').trim();
  const status = String(req.body?.status || '').trim().toUpperCase();
  if (!id) return res.status(400).json({ error: 'Missing id' });
  if (!VALID.has(status)) return res.status(400).json({ error: 'Invalid status' });
  const updatedAt = new Date().toISOString();
  const updatedBy = req.headers['x-admin-user'] || 'admin:local';
  try {
    const fs = require('fs');
    const line = JSON.stringify({ id, status, updatedAt, updatedBy }) + '\n';
    fs.appendFileSync('/tmp/admin-orders-audit.log', line);
  } catch {}
  return res.json({ ok: true, id, status, updatedAt, updatedBy });
});
module.exports = router;
