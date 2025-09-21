import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();
router.use(express.json());

async function getPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASS || 'app',
    database: process.env.DB_NAME || 'monshop',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
}

router.get('/admin/orders', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const page  = Math.max(1, parseInt(req.query.page || '1', 10));
    const offset = (page - 1) * limit;

    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT id, total_t_t_c AS total_ttc, currency, status, provider, created_at, updated_at
       FROM orders
       ORDER BY id DESC
       LIMIT ? OFFSET ?`, [limit, offset]
    );
    const [[cnt]] = await pool.query(`SELECT COUNT(*) AS n FROM orders`);
    res.json({ items: rows, total: cnt.n, page, limit });
  } catch (e) {
    res.status(500).json({ error: 'orders list failed' });
  }
});

router.get('/admin/orders/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid id' });

    const pool = await getPool();
    const [[order]] = await pool.query(
      `SELECT id, total_t_t_c AS total_ttc, currency, status, provider,
              shipping_json, billing_json, created_at, updated_at
       FROM orders WHERE id = ?`, [id]
    );
    if (!order) return res.status(404).json({ error: 'not found' });

    const [items] = await pool.query(
      `SELECT id, title, qty, price_h_t, tva, product_id
       FROM order_items WHERE order_id = ? ORDER BY id`, [id]
    );
    res.json({ ...order, items });
  } catch (e) {
    res.status(500).json({ error: 'order fetch failed' });
  }
});

router.put('/admin/orders/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!id) return res.status(400).json({ error: 'invalid id' });
    if (!['PENDING','PAID','SHIPPED','CANCELLED'].includes(status))
      return res.status(400).json({ error: 'invalid status' });

    const pool = await getPool();
    const [r] = await pool.query(
      `UPDATE orders SET status=?, updated_at=NOW() WHERE id=?`, [status, id]
    );
    res.json({ ok: r.affectedRows > 0 });
  } catch (e) {
    res.status(500).json({ error: 'status update failed' });
  }
});

export default router;
