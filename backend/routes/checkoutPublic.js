import express from 'express';
import mysql from 'mysql2/promise';
const router = express.Router();
router.use(express.json());
async function getPool() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'app',
    password: process.env.DB_PASS || 'app',
    database: process.env.DB_NAME || 'monshop',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  });
  return pool;
}
router.post('/checkout', async (req, res) => {
  try {
    const { items = [], customer = {}, notes = '' } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items required' });
    }
    const pool = await getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const wantIds = items.filter(i => i.productId).map(i => Number(i.productId));
      const wantSlugs = items.filter(i => i.slug).map(i => String(i.slug));
      if (wantIds.length + wantSlugs.length === 0) {
        throw new Error('items must contain productId or slug');
      }
      let products = [];
      if (wantIds.length) {
        const [rows] = await conn.query(
          `SELECT id, title, slug, price_h_t, tva, stock FROM products WHERE id IN (?)`,
          [wantIds]
        );
        products = products.concat(rows);
      }
      if (wantSlugs.length) {
        const [rows] = await conn.query(
          `SELECT id, title, slug, price_h_t, tva, stock FROM products WHERE slug IN (?)`,
          [wantSlugs]
        );
        products = products.concat(rows);
      }
      if (products.length === 0) throw new Error('no products found');
      const byKey = new Map();
      for (const p of products) byKey.set(p.id, p);
      const lines = [];
      for (const it of items) {
        const pid = it.productId ? Number(it.productId) :
                   (products.find(p => p.slug === String(it.slug))?.id);
        const qty = Math.max(1, Number(it.qty || 1));
        const p = byKey.get(pid);
        if (!p) throw new Error(`product not found: ${it.productId || it.slug}`);
        if (p.stock < qty) throw new Error(`not enough stock for ${p.slug}`);
        lines.push({ pid: p.id, title: p.title, qty, price_h_t: Number(p.price_h_t), tva: Number(p.tva) });
      }
      const total_ttc = lines.reduce((acc, l) => acc + l.qty * l.price_h_t * (1 + l.tva / 100), 0);
      const [ordRes] = await conn.query(
        `INSERT INTO orders (total_t_t_c, currency, status, provider, shipping_json, billing_json, created_at, updated_at, user_id)
         VALUES (?, 'EUR', 'PENDING', 'fake', ?, ?, NOW(), NOW(), NULL)`,
        [
          total_ttc.toFixed(2),
          JSON.stringify({ address: customer.address || null, name: customer.name || null }),
          JSON.stringify({ email: customer.email || null, notes: notes || null })
        ]
      );
      const orderId = ordRes.insertId;
      for (const l of lines) {
        await conn.query(
          `INSERT INTO order_items (title, qty, price_h_t, tva, created_at, updated_at, order_id, product_id)
           VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
          [l.title, l.qty, l.price_h_t.toFixed(2), l.tva.toFixed(2), orderId, l.pid]
        );
        await conn.query(`UPDATE products SET stock = stock - ? WHERE id = ?`, [l.qty, l.pid]);
      }
      await conn.commit();
      res.status(201).json({ id: orderId, total_ttc: Number(total_ttc.toFixed(2)), currency: 'EUR', status: 'PENDING' });
    } catch (e) {
      await (conn?.rollback?.());
      res.status(400).json({ error: String(e.message || e) });
    } finally {
      conn?.release?.();
    }
  } catch (e) {
    res.status(500).json({ error: 'checkout failed' });
  }
});
export default router;
